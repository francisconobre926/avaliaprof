import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ModerationService } from '../moderation/moderation.service';
import { PeriodsService } from '../periods/periods.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatsService } from '../evaluations/stats.service';
import { CreateSessionDto } from './teacher.dto';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);

/** Área do docente: só vê e gere o que é seu. A ficha vem sempre da conta autenticada, nunca de um id do pedido. */
@Injectable()
export class TeacherService {
  constructor(
    private prisma: PrismaService,
    private stats: StatsService,
    private moderation: ModerationService,
    private periods: PeriodsService,
    private notifications: NotificationsService,
  ) {}

  private async mine(userId: string) {
    const t = await this.prisma.teacher.findUnique({
      where: { userId },
      include: { department: { select: { name: true } }, subjects: { include: { subject: { select: { id: true, name: true, courseSubjects: { include: { course: { select: { id: true, name: true } } } } } } } } },
    });
    if (!t) throw new NotFoundException('A tua conta não está associada a nenhuma ficha de docente. Contacta a administração.');
    return t;
  }

  async me(userId: string) {
    const t = await this.mine(userId);
    return {
      id: t.id,
      name: t.name,
      photoUrl: t.photoUrl,
      department: t.department.name,
      publicCode: t.publicCode,
      subjects: t.subjects.map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        courseSubjects: s.subject.courseSubjects.map((c) => ({ id: c.id, courseId: c.course.id, courseName: c.course.name, courseYear: c.courseYear, semesterNumber: c.semesterNumber })),
      })),
    };
  }

  async statsOf(userId: string, subjectId?: string) {
    const t = await this.mine(userId);
    return this.stats.teacherStats(t.id, subjectId);
  }

  /** Comentários publicados sobre o docente, com a sua resposta (sem autor, sem data). */
  async comments(userId: string, page: number, pageSize: number, subjectId?: string) {
    const t = await this.mine(userId);
    const where = { status: 'PUBLISHED' as const, evaluation: { teacherId: t.id, ...(subjectId && { subjectId }) } };
    const [total, rows] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where, orderBy: { id: 'asc' }, skip: page * pageSize, take: pageSize,
        select: { id: true, text: true, replyText: true, evaluation: { select: { semester: { select: { label: true } }, subject: { select: { name: true } } } } },
      }),
    ]);
    return {
      items: rows.map((c) => ({ id: c.id, text: c.text, reply: c.replyText, semester: c.evaluation.semester.label, subject: c.evaluation.subject.name })),
      total,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  private async ownComment(userId: string, commentId: string) {
    const t = await this.mine(userId);
    const c = await this.prisma.comment.findFirst({ where: { id: commentId, status: 'PUBLISHED', evaluation: { teacherId: t.id } }, select: { id: true, evaluation: { select: { studentId: true } } } });
    if (!c) throw new NotFoundException('Comentário não encontrado.');
    return c.evaluation.studentId;
  }

  async reply(userId: string, commentId: string, text: string) {
    const studentId = await this.ownComment(userId, commentId);
    const r = this.moderation.classify(text, false);
    if (r.status !== 'PUBLISHED') throw err(422, 'RESPOSTA_REJEITADA', r.message ?? 'A resposta não cumpre as regras de conteúdo.');
    await this.prisma.comment.update({ where: { id: commentId }, data: { replyText: text, replyAt: new Date() } });
    await this.notifications.notify({ userId: studentId, type: 'TEACHER_REPLY', title: 'O docente respondeu', body: 'O docente respondeu a um comentário teu.', data: { screen: 'minhas-avaliacoes' } });
    return { ok: true };
  }

  async removeReply(userId: string, commentId: string) {
    await this.ownComment(userId, commentId);
    await this.prisma.comment.update({ where: { id: commentId }, data: { replyText: null, replyAt: null } });
    return { ok: true };
  }

  // ── Sessões de avaliação por QR ──

  private sessionView(s: Prisma.EvaluationSessionGetPayload<{ include: { courseSubject: { include: { subject: true; course: true } }; classGroup: true } }>, now = new Date()) {
    const live = s.status === 'ACTIVE' && s.opensAt <= now && now <= s.closesAt;
    return {
      id: s.id,
      qrToken: s.qrToken,
      subject: s.courseSubject.subject.name,
      course: s.courseSubject.course.name,
      courseSubjectId: s.courseSubjectId,
      classGroup: s.classGroup ? { id: s.classGroup.id, name: s.classGroup.name } : null,
      opensAt: s.opensAt,
      closesAt: s.closesAt,
      status: s.status === 'CLOSED' ? 'CLOSED' : live ? 'ACTIVE' : 'EXPIRED',
    };
  }
  private sessionInclude = { courseSubject: { include: { subject: true, course: true } }, classGroup: true } as const;

  async createSession(userId: string, dto: CreateSessionDto) {
    const t = await this.mine(userId);
    const cs = await this.prisma.courseSubject.findUnique({ where: { id: dto.courseSubjectId } });
    const teaches = cs && await this.prisma.teacherSubject.findUnique({ where: { teacherId_subjectId: { teacherId: t.id, subjectId: cs.subjectId } } });
    if (!cs || !teaches) throw err(403, 'NAO_LECCIONA', 'Só podes criar sessões para cadeiras que lecciona.');
    const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) throw err(409, 'SEM_SEMESTRE_ACTUAL', 'Não há semestre em curso definido pela administração.');
    if (cs.semesterNumber !== semester.number) throw err(409, 'FORA_DO_SEMESTRE', 'Esta cadeira não é leccionada no semestre corrente.');
    if (dto.classGroupId) {
      const cg = await this.prisma.classGroup.findUnique({ where: { id: dto.classGroupId } });
      if (!cg || cg.courseId !== cs.courseId || cg.semesterId !== semester.id) throw err(400, 'TURMA_INVALIDA', 'A turma não pertence ao curso desta cadeira neste semestre.');
    }
    // A sessão complementa o período: sem período aberto para a cadeira não há sessão (D-12).
    if (!(await this.periods.openPeriodFor(semester.id, cs.courseId, cs.id))) {
      throw err(409, 'PERIODO_FECHADO', 'O período de avaliação desta cadeira não está aberto.');
    }
    const now = new Date();
    const s = await this.prisma.evaluationSession.create({
      data: { teacherId: t.id, courseSubjectId: cs.id, classGroupId: dto.classGroupId ?? null, opensAt: now, closesAt: new Date(now.getTime() + dto.minutes * 60_000) },
      include: this.sessionInclude,
    });
    return this.sessionView(s);
  }

  async sessions(userId: string) {
    const t = await this.mine(userId);
    const rows = await this.prisma.evaluationSession.findMany({ where: { teacherId: t.id }, orderBy: { createdAt: 'desc' }, take: 30, include: this.sessionInclude });
    return { items: rows.map((s) => this.sessionView(s)) };
  }

  async closeSession(userId: string, id: string) {
    const t = await this.mine(userId);
    const s = await this.prisma.evaluationSession.findFirst({ where: { id, teacherId: t.id } });
    if (!s) throw new NotFoundException('Sessão não encontrada.');
    const u = await this.prisma.evaluationSession.update({ where: { id }, data: { status: 'CLOSED' }, include: this.sessionInclude });
    return this.sessionView(u);
  }
}
