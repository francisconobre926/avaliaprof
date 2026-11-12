import { Injectable, NotFoundException } from '@nestjs/common';
import { getMinSample } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const r2 = (n: number) => Math.round(n * 100) / 100;
const mean = (xs: number[]) => (xs.length ? r2(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

export interface TeacherSummary { count: number; average: number | null }

/**
 * Estatísticas públicas. Para proteger o anonimato, médias, distribuição e evolução só são
 * mostradas a partir de `MIN_SAMPLE` avaliações (por defeito 5). Abaixo disso devolve-se apenas
 * a contagem. Nada aqui contém identificadores de estudantes.
 */
@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /** Média geral por docente, para listagens. `average` é null abaixo da amostra mínima. */
  async summaries(teacherIds: string[]): Promise<Map<string, TeacherSummary>> {
    const out = new Map<string, TeacherSummary>();
    if (!teacherIds.length) return out;
    const min = getMinSample();
    const rows = await this.prisma.evaluation.groupBy({
      by: ['teacherId'],
      where: { teacherId: { in: teacherIds } },
      _count: { _all: true },
      _avg: { clarity: true, punctuality: true, availability: true, mastery: true, fairness: true },
    });
    for (const r of rows) {
      const a = r._avg;
      const parts = [a.clarity, a.punctuality, a.availability, a.mastery, a.fairness].filter((x): x is number => x != null);
      out.set(r.teacherId, {
        count: r._count._all,
        average: r._count._all >= min && parts.length ? mean(parts) : null,
      });
    }
    return out;
  }

  async teacherStats(teacherId: string, subjectId?: string) {
    if (!(await this.prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }))) {
      throw new NotFoundException('Professor não encontrado.');
    }
    const min = getMinSample();
    const rows = await this.prisma.evaluation.findMany({
      where: { teacherId, ...(subjectId && { subjectId }) },
      select: {
        clarity: true, punctuality: true, availability: true, mastery: true, fairness: true,
        semester: { select: { label: true, startsAt: true } },
      },
    });
    const count = rows.length;
    if (count < min) return { count, sufficient: false as const, minSample: min };

    const criteria = {
      clarity: mean(rows.map((r) => r.clarity))!,
      punctuality: mean(rows.map((r) => r.punctuality))!,
      availability: mean(rows.map((r) => r.availability))!,
      mastery: mean(rows.map((r) => r.mastery))!,
      fairness: mean(rows.map((r) => r.fairness))!,
    };
    const perEvaluation = rows.map((r) => (r.clarity + r.punctuality + r.availability + r.mastery + r.fairness) / 5);

    const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    for (const v of perEvaluation) distribution[String(Math.min(5, Math.max(1, Math.round(v)))) as '1'] += 1;

    const bySemester = new Map<string, { startsAt: Date; values: number[] }>();
    rows.forEach((r, i) => {
      const s = bySemester.get(r.semester.label) ?? { startsAt: r.semester.startsAt, values: [] };
      s.values.push(perEvaluation[i]);
      bySemester.set(r.semester.label, s);
    });
    const evolution = [...bySemester.entries()]
      .sort((a, b) => a[1].startsAt.getTime() - b[1].startsAt.getTime())
      // Cada ponto também respeita a amostra mínima; abaixo dela só se indica a contagem.
      .map(([semester, s]) => ({ semester, count: s.values.length, average: s.values.length >= min ? mean(s.values) : null }));

    return { count, sufficient: true as const, minSample: min, average: mean(perEvaluation)!, criteria, distribution, evolution };
  }

  /**
   * Comentários publicados. Sem autor, sem data/hora (só o semestre) e fora de ordem cronológica
   * (ordenados pelo id aleatório), para não correlacionar com o momento de submissão.
   */
  async comments(teacherId: string, page: number, pageSize: number, subjectId?: string) {
    if (!(await this.prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }))) {
      throw new NotFoundException('Professor não encontrado.');
    }
    const where = { status: 'PUBLISHED' as const, evaluation: { teacherId, ...(subjectId && { subjectId }) } };
    const [total, rows] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: page * pageSize,
        take: pageSize,
        select: { id: true, text: true, replyText: true, evaluation: { select: { semester: { select: { label: true } } } } },
      }),
    ]);
    return {
      items: rows.map((c) => ({ id: c.id, text: c.text, reply: c.replyText, semester: c.evaluation.semester.label })),
      total,
      hasMore: (page + 1) * pageSize < total,
    };
  }
}
