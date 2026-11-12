import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getMinSample } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const r2 = (n: number) => Math.round(n * 100) / 100;
const mean = (xs: number[]) => (xs.length ? r2(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

export interface InsightsQuery { courseId?: string; subjectId?: string; semesterId?: string; limit?: number }

/**
 * Rankings e estatísticas agregadas, abertos a todos os docentes (para se conhecerem os mais populares),
 * sem restrição de âmbito. Regras:
 *  - médias, distribuição e evolução só aparecem a partir de MIN_SAMPLE avaliações (anonimato);
 *  - tudo é calculado a partir de avaliações reais; nada contém identificadores de estudantes.
 */
@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  /** Cadeiras a considerar pelos filtros de curso e cadeira. `null` = todas. */
  private async subjectScope(q: InsightsQuery): Promise<string[] | null> {
    let ids: string[] | null = null;
    if (q.courseId) ids = (await this.prisma.courseSubject.findMany({ where: { courseId: q.courseId }, select: { subjectId: true } })).map((c) => c.subjectId);
    if (q.subjectId) ids = ids ? ids.filter((i) => i === q.subjectId) : [q.subjectId];
    return ids;
  }

  /** Opções dos filtros do ecrã de estatísticas: cursos, cadeiras (com os cursos onde existem) e semestres. */
  async options() {
    const [courses, subjects, semesters] = await Promise.all([
      this.prisma.course.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      this.prisma.subject.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, courseSubjects: { select: { courseId: true } } } }),
      this.prisma.semester.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, label: true, isCurrent: true } }),
    ]);
    return {
      courses,
      subjects: subjects.map(({ courseSubjects, ...s }) => ({ ...s, courseIds: courseSubjects.map((c) => c.courseId) })),
      semesters,
      minSample: getMinSample(),
    };
  }

  /** Ranking dos docentes mais bem avaliados (só com amostra suficiente), dentro do âmbito e dos filtros. */
  async ranking(q: InsightsQuery) {
    const min = getMinSample();
    const limit = q.limit ?? 10;
    const subjects = await this.subjectScope(q);
    if (subjects && subjects.length === 0) return { items: [], hidden: 0, minSample: min };

    const where: Prisma.EvaluationWhereInput = {
      ...(subjects && { subjectId: { in: subjects } }),
      ...(q.semesterId && { semesterId: q.semesterId }),
    };

    const rows = await this.prisma.evaluation.groupBy({
      by: ['teacherId'],
      where,
      _count: { _all: true },
      _avg: { clarity: true, punctuality: true, availability: true, mastery: true, fairness: true },
    });
    const enough = rows.filter((r) => r._count._all >= min);
    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: enough.map((r) => r.teacherId) } },
      select: { id: true, name: true, photoUrl: true, department: { select: { name: true } } },
    });
    const byId = new Map(teachers.map((t) => [t.id, t]));
    const items = enough
      .map((r) => {
        const a = r._avg;
        const parts = [a.clarity, a.punctuality, a.availability, a.mastery, a.fairness].map((x) => x ?? 0);
        return {
          teacher: byId.get(r.teacherId)!,
          count: r._count._all,
          average: mean(parts)!,
          criteria: { clarity: r2(a.clarity ?? 0), punctuality: r2(a.punctuality ?? 0), availability: r2(a.availability ?? 0), mastery: r2(a.mastery ?? 0), fairness: r2(a.fairness ?? 0) },
        };
      })
      .sort((x, y) => y.average - x.average || y.count - x.count || x.teacher.name.localeCompare(y.teacher.name, 'pt'))
      .slice(0, limit)
      .map((it, i) => ({
        position: i + 1,
        teacher: { id: it.teacher.id, name: it.teacher.name, photoUrl: it.teacher.photoUrl, department: it.teacher.department.name },
        average: it.average,
        count: it.count,
        criteria: it.criteria,
      }));
    return { items, hidden: rows.length - enough.length, minSample: min };
  }

  /** Médias por critério, distribuição e evolução por semestre, agregadas sobre as cadeiras do âmbito. */
  async overview(q: InsightsQuery) {
    const min = getMinSample();
    const subjects = await this.subjectScope(q);
    if (subjects && subjects.length === 0) return { count: 0, sufficient: false as const, minSample: min };

    const rows = await this.prisma.evaluation.findMany({
      where: { ...(subjects && { subjectId: { in: subjects } }), ...(q.semesterId && { semesterId: q.semesterId }) },
      select: { clarity: true, punctuality: true, availability: true, mastery: true, fairness: true, semester: { select: { label: true, startsAt: true } } },
    });
    const count = rows.length;
    if (count < min) return { count, sufficient: false as const, minSample: min };

    const per = rows.map((r) => (r.clarity + r.punctuality + r.availability + r.mastery + r.fairness) / 5);
    const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    for (const v of per) distribution[String(Math.min(5, Math.max(1, Math.round(v)))) as '1'] += 1;

    const bySem = new Map<string, { startsAt: Date; values: number[] }>();
    rows.forEach((r, i) => {
      const s = bySem.get(r.semester.label) ?? { startsAt: r.semester.startsAt, values: [] };
      s.values.push(per[i]);
      bySem.set(r.semester.label, s);
    });
    return {
      count,
      sufficient: true as const,
      minSample: min,
      average: mean(per)!,
      criteria: {
        clarity: mean(rows.map((r) => r.clarity))!,
        punctuality: mean(rows.map((r) => r.punctuality))!,
        availability: mean(rows.map((r) => r.availability))!,
        mastery: mean(rows.map((r) => r.mastery))!,
        fairness: mean(rows.map((r) => r.fairness))!,
      },
      distribution,
      evolution: [...bySem.entries()]
        .sort((a, b) => a[1].startsAt.getTime() - b[1].startsAt.getTime())
        .map(([semester, s]) => ({ semester, count: s.values.length, average: s.values.length >= min ? mean(s.values) : null })),
    };
  }
}
