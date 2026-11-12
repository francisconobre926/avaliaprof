import { Injectable } from '@nestjs/common';
import { getMinSample } from '../config/env';
import { PeriodsService } from '../periods/periods.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherScopeService } from '../teacher-scope/teacher-scope.service';
import { StatsService } from './stats.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

/** Resumo do ecrã de início do estudante: tudo calculado a partir da sua matrícula e das avaliações reais. */
@Injectable()
export class HomeService {
  constructor(
    private prisma: PrismaService,
    private periods: PeriodsService,
    private scope: TeacherScopeService,
    private stats: StatsService,
  ) {}

  async home(user: AuthUser) {
    const min = getMinSample();
    const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    const subjectIds = (await this.scope.subjectIdsFor(user)) ?? [];
    const base = { semester: semester ? { id: semester.id, label: semester.label } : null, minSample: min };
    if (!semester || subjectIds.length === 0) {
      // Sem matrícula não há "por avaliar" nem "as minhas", mas os destaques são públicos.
      return { ...base, summary: { subjects: 0, teachers: 0, evaluationsDone: 0, pending: 0 }, pending: [], featured: await this.featured(), recent: [] };
    }

    const matricula = await this.prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId: user.userId, semesterId: semester.id } },
      include: { classGroup: { select: { courseId: true } } },
    });
    const courseId = matricula!.classGroup.courseId;

    const [mine, done, recent, meusDocentes] = await Promise.all([
      this.prisma.studentSubject.findMany({
        where: { studentId: user.userId, semesterId: semester.id },
        include: { courseSubject: { include: { subject: { select: { id: true, name: true, teachers: { select: { teacher: { select: { id: true, name: true } } } } } } } } },
      }),
      this.prisma.evaluation.findMany({ where: { studentId: user.userId, semesterId: semester.id }, select: { teacherId: true, subjectId: true } }),
      this.prisma.evaluation.findMany({
        where: { studentId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, clarity: true, punctuality: true, availability: true, mastery: true, fairness: true, teacher: { select: { id: true, name: true } }, subject: { select: { name: true } }, semester: { select: { label: true } } },
      }),
      this.prisma.teacher.findMany({
        where: { subjects: { some: { subjectId: { in: subjectIds } } } },
        select: { id: true },
      }),
    ]);

    // Por avaliar: docente x cadeira que o estudante ainda não avaliou e cujo período está aberto.
    const feitas = new Set(done.map((d) => `${d.teacherId}|${d.subjectId}`));
    const pending: { teacherId: string; teacherName: string; subjectName: string; courseSubjectId: string; closesAt: Date }[] = [];
    for (const m of mine) {
      const falta = m.courseSubject.subject.teachers.filter((t) => !feitas.has(`${t.teacher.id}|${m.courseSubject.subject.id}`));
      if (!falta.length) continue;
      const periodo = await this.periods.openPeriodFor(semester.id, courseId, m.courseSubjectId);
      if (!periodo) continue;
      for (const t of falta) {
        pending.push({ teacherId: t.teacher.id, teacherName: t.teacher.name, subjectName: m.courseSubject.subject.name, courseSubjectId: m.courseSubjectId, closesAt: periodo.closesAt });
      }
    }
    pending.sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime() || a.subjectName.localeCompare(b.subjectName, 'pt'));

    const featured = await this.featured();

    return {
      ...base,
      summary: { subjects: subjectIds.length, teachers: meusDocentes.length, evaluationsDone: done.length, pending: pending.length },
      pending: pending.slice(0, 10),
      featured,
      // As minhas avaliações mais recentes (só as minhas: nada que revele o momento das dos outros).
      recent: recent.map((e) => ({
        id: e.id,
        teacher: e.teacher,
        subject: e.subject.name,
        semester: e.semester.label,
        overall: Math.round(((e.clarity + e.punctuality + e.availability + e.mastery + e.fairness) / 5) * 100) / 100,
      })),
    };
  }

  /** Em destaque: os docentes mais bem avaliados de todos, só com amostra suficiente (anonimato). */
  private async featured() {
    const todos = await this.prisma.teacher.findMany({ select: { id: true, name: true, photoUrl: true, department: { select: { name: true } } } });
    const resumos = await this.stats.summaries(todos.map((t) => t.id));
    return todos
      .map((t) => ({ t, s: resumos.get(t.id) }))
      .filter((x) => x.s?.average != null)
      .sort((a, b) => b.s!.average! - a.s!.average! || b.s!.count - a.s!.count || a.t.name.localeCompare(b.t.name, 'pt'))
      .slice(0, 5)
      .map(({ t, s }) => ({ id: t.id, name: t.name, photoUrl: t.photoUrl, department: t.department.name, average: s!.average, count: s!.count }));
  }
}
