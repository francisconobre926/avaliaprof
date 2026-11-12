import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { getMinSample } from '../config/env';

/**
 * Quem pode ver que docente. O estudante só vê os docentes que lhe dão aulas: os das cadeiras da sua
 * matrícula activa no semestre corrente. O administrador vê todos; o docente vê o seu e os públicos. É regra do servidor:
 * esconder opções na interface não chega.
 */
@Injectable()
export class TeacherScopeService {
  constructor(private prisma: PrismaService) {}

  /** `null` = sem restrição; caso contrário os ids das cadeiras do estudante (vazio se não tiver matrícula activa). */
  async subjectIdsFor(user: AuthUser): Promise<string[] | null> {
    if (user.role !== Role.STUDENT) return null;
    const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) return [];
    const matricula = await this.prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId: user.userId, semesterId: semester.id } },
      select: { status: true },
    });
    if (matricula?.status !== 'ACTIVE') return [];
    const rows = await this.prisma.studentSubject.findMany({
      where: { studentId: user.userId, semesterId: semester.id },
      select: { courseSubject: { select: { subjectId: true } } },
    });
    return [...new Set(rows.map((r) => r.courseSubject.subjectId))];
  }

  /**
   * Perfil, estatísticas e comentários: o estudante vê os docentes que lhe dão aulas e também os docentes já
   * "públicos", isto é, com avaliações suficientes para aparecerem em rankings e destaques (MIN_SAMPLE). Os
   * restantes dão 404 (e não 403), para não revelar que existem.
   */
  async assertCanView(user: AuthUser, teacherId: string): Promise<void> {
    if (user.role === Role.ADMIN) return;
    // O docente vê o seu próprio perfil; os dos colegas só se já forem públicos (amostra mínima), tal como o estudante.
    if (user.role === Role.TEACHER) {
      if (await this.prisma.teacher.findFirst({ where: { id: teacherId, userId: user.userId }, select: { id: true } })) return;
      if ((await this.prisma.evaluation.count({ where: { teacherId } })) >= getMinSample()) return;
      throw new NotFoundException('Professor não encontrado.');
    }
    const ids = await this.subjectIdsFor(user);
    if (ids === null) return;
    if (ids.length > 0 && (await this.prisma.teacherSubject.findFirst({ where: { teacherId, subjectId: { in: ids } }, select: { teacherId: true } }))) return;
    if ((await this.prisma.evaluation.count({ where: { teacherId } })) >= getMinSample()) return;
    throw new NotFoundException('Professor não encontrado.');
  }
}
