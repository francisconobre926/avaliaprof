import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationsService } from './evaluations.service';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);

/**
 * Leitura de QR Codes. O QR só identifica um docente ou uma sessão; quem decide se se pode avaliar
 * é sempre o servidor (conta, matrícula, inscrição na cadeira, período aberto, ainda não avaliou).
 */
@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private evaluations: EvaluationsService,
  ) {}

  /** QR permanente do docente: devolve as cadeiras que o estudante pode (ou não) avaliar a este docente. */
  async byTeacherCode(userId: string, publicCode: string) {
    const t = await this.prisma.teacher.findUnique({ where: { publicCode }, select: { id: true } });
    if (!t) throw new NotFoundException({ code: 'QR_INVALIDO', message: 'QR Code inválido.' });
    const e = await this.evaluations.eligibility(userId, t.id);
    return { kind: 'TEACHER' as const, ...e };
  }

  /** QR de sessão. Ordem das verificações: sessão activa → matrícula → turma → inscrição na cadeira → já avaliou / período. */
  async bySession(userId: string, token: string) {
    const s = await this.prisma.evaluationSession.findUnique({
      where: { qrToken: token },
      include: { courseSubject: { select: { id: true, subjectId: true } } },
    });
    if (!s) throw new NotFoundException({ code: 'QR_INVALIDO', message: 'QR Code inválido.' });
    const now = new Date();
    if (s.status !== 'ACTIVE') throw err(409, 'SESSAO_ENCERRADA', 'Esta sessão de avaliação já foi encerrada pelo docente.');
    if (now < s.opensAt || now > s.closesAt) throw err(409, 'SESSAO_EXPIRADA', 'Esta sessão de avaliação já expirou.');

    const e = await this.evaluations.eligibility(userId, s.teacherId); // exige matrícula activa (403)
    if (s.classGroupId) {
      const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
      const m = semester && await this.prisma.enrollment.findUnique({ where: { studentId_semesterId: { studentId: userId, semesterId: semester.id } } });
      if (!m || m.classGroupId !== s.classGroupId) throw err(403, 'FORA_DA_TURMA', 'Esta sessão é de outra turma.');
    }
    const item = e.items.find((i) => i.courseSubjectId === s.courseSubjectId);
    if (!item) throw err(403, 'NAO_INSCRITO', 'Não estás inscrito nesta cadeira.');
    return { kind: 'SESSION' as const, teacher: e.teacher, semester: e.semester, items: [item], sessionClosesAt: s.closesAt };
  }
}
