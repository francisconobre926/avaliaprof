import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { coversScope, isEffectivelyOpen } from './periods.rules';

export { coversScope, isEffectivelyOpen };

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

  /** Período efectivamente aberto que abrange esta cadeira do curso, no semestre indicado (ou null). */
  async openPeriodFor(semesterId: string, courseId: string, courseSubjectId: string, now = new Date()) {
    const periods = await this.prisma.evaluationPeriod.findMany({
      where: { semesterId, status: 'OPEN', opensAt: { lte: now }, closesAt: { gte: now } },
      include: { courses: true, courseSubjects: true },
      orderBy: { closesAt: 'desc' },
    });
    return periods.find((p) => coversScope(p, courseId, courseSubjectId)) ?? null;
  }

  /** Períodos do semestre corrente que abrangem o curso do estudante (sem âmbito = todo o semestre). */
  async currentForStudent(userId: string) {
    const [user, semester] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { courseId: true } }),
      this.prisma.semester.findFirst({ where: { isCurrent: true } }),
    ]);
    if (!semester || !user?.courseId) return { semester: null, periods: [], serverTime: new Date() };

    const periods = await this.prisma.evaluationPeriod.findMany({
      where: {
        semesterId: semester.id,
        OR: [
          { courses: { none: {} }, courseSubjects: { none: {} } },
          { courses: { some: { courseId: user.courseId } } },
          { courseSubjects: { some: { courseSubject: { courseId: user.courseId } } } },
        ],
      },
      orderBy: { opensAt: 'asc' },
    });
    const now = new Date();
    return {
      semester: { id: semester.id, label: semester.label },
      serverTime: now,
      periods: periods.map((p) => ({ id: p.id, opensAt: p.opensAt, closesAt: p.closesAt, open: isEffectivelyOpen(p, now) })),
    };
  }
}
