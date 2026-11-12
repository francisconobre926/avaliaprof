import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { StatsService } from '../evaluations/stats.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { TeacherScopeService } from '../teacher-scope/teacher-scope.service';

const SEM_AVALIACOES = { count: 0, average: null };

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private stats: StatsService,
    private scope: TeacherScopeService,
  ) {}

  courses() {
    return this.prisma.course.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
  }

  /**
   * Opções dos filtros. O estudante só vê o seu curso, as suas cadeiras e os departamentos dos
   * docentes que lhe dão aulas; docentes e administradores veem tudo.
   */
  async filterOptions(user: AuthUser) {
    const ids = await this.scope.subjectIdsFor(user);
    const subjects = await this.prisma.subject.findMany({
      where: ids ? { id: { in: ids } } : {},
      orderBy: { name: 'asc' },
      select: { id: true, name: true, departmentId: true, courseSubjects: { select: { courseId: true } } },
    });
    let courses = await this.courses();
    let departments = await this.prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
    if (ids) {
      const donoCurso = await this.prisma.enrollment.findFirst({ where: { studentId: user.userId, status: 'ACTIVE', semester: { isCurrent: true } }, select: { classGroup: { select: { courseId: true } } } });
      courses = courses.filter((c) => c.id === donoCurso?.classGroup.courseId);
      const deps = new Set((await this.prisma.teacher.findMany({ where: { subjects: { some: { subjectId: { in: ids } } } }, select: { departmentId: true } })).map((t) => t.departmentId));
      departments = departments.filter((d) => deps.has(d.id));
    }
    return {
      courses,
      departments,
      subjects: subjects.map(({ courseSubjects, ...s }) => ({ ...s, courseIds: courseSubjects.map((c) => c.courseId) })),
    };
  }

  async teachers(q: TeachersQueryDto, user: AuthUser) {
    const page = q.page ?? 0;
    const pageSize = q.pageSize ?? 10;
    const ids = await this.scope.subjectIdsFor(user);
    if (ids && ids.length === 0) return { items: [], total: 0, hasMore: false };

    const subjectFilter: Prisma.SubjectWhereInput = {
      ...(q.courseId && { courseSubjects: { some: { courseId: q.courseId } } }),
      ...(q.subjectId && { id: q.subjectId }),
    };
    const filtros: Prisma.TeacherWhereInput = {
      ...(q.q && { name: { contains: q.q, mode: 'insensitive' } }),
      ...(q.departmentId && { departmentId: q.departmentId }),
      ...(Object.keys(subjectFilter).length && { subjects: { some: { subject: subjectFilter } } }),
    };
    // O estudante só vê quem lecciona alguma das suas cadeiras.
    const where: Prisma.TeacherWhereInput = ids ? { AND: [filtros, { subjects: { some: { subjectId: { in: ids } } } }] } : filtros;

    const [total, rows] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: page * pageSize,
        take: pageSize,
        include: { department: { select: { name: true } }, subjects: { select: { subjectId: true } } },
      }),
    ]);
    const stats = await this.stats.summaries(rows.map((t) => t.id));

    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        photoUrl: t.photoUrl,
        departmentId: t.departmentId,
        departmentName: t.department.name,
        subjectIds: t.subjects.map((s) => s.subjectId),
        ...(stats.get(t.id) ?? SEM_AVALIACOES),
      })),
      total,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  async teacher(id: string, user: AuthUser) {
    await this.scope.assertCanView(user, id);
    const t = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        subjects: { include: { subject: { include: { courseSubjects: { include: { course: { select: { id: true, name: true } } } } } } } },
      },
    });
    if (!t) throw new NotFoundException('Professor não encontrado.');
    const stats = (await this.stats.summaries([t.id])).get(t.id) ?? SEM_AVALIACOES;
    return {
      id: t.id,
      name: t.name,
      photoUrl: t.photoUrl,
      department: t.department,
      subjects: t.subjects
        .map((s) => ({ id: s.subject.id, name: s.subject.name, courses: s.subject.courseSubjects.map((cs) => cs.course) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt')),
      ...stats,
    };
  }
}
