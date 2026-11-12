import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CandidatesQueryDto, ClassGroupsQueryDto, CreateClassGroupDto } from './admin-students.dto';
import { classGroupName } from './class-group-name';
import { syncAutoSubjects } from './enrollment-sync';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);

@Injectable()
export class AdminClassGroupsService {
  constructor(private prisma: PrismaService) {}

  /** Cursos, semestres e turmas para preencher formulários e filtros. Os anos vêm das cadeiras e turmas existentes. */
  async options() {
    const [courses, semesters, groups, years] = await Promise.all([
      this.prisma.course.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } }),
      this.prisma.semester.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, label: true, number: true, isCurrent: true } }),
      this.prisma.classGroup.findMany({ orderBy: [{ courseYear: 'asc' }, { name: 'asc' }], select: { id: true, name: true, regime: true, courseId: true, courseYear: true, semesterId: true } }),
      this.prisma.courseSubject.groupBy({ by: ['courseId', 'courseYear'] }),
    ]);
    const yearsByCourse = new Map<string, Set<number>>();
    for (const y of years) yearsByCourse.set(y.courseId, (yearsByCourse.get(y.courseId) ?? new Set()).add(y.courseYear));
    for (const g of groups) yearsByCourse.set(g.courseId, (yearsByCourse.get(g.courseId) ?? new Set()).add(g.courseYear));
    return {
      courses: courses.map((c) => ({ ...c, years: [...(yearsByCourse.get(c.id) ?? [])].sort((a, b) => a - b) })),
      semesters,
      classGroups: groups,
    };
  }

  async list(q: ClassGroupsQueryDto) {
    const semester = q.semesterId
      ? await this.prisma.semester.findUnique({ where: { id: q.semesterId } })
      : await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) throw err(409, 'SEM_SEMESTRE', 'Não há semestre corrente definido.');
    const rows = await this.prisma.classGroup.findMany({
      where: { semesterId: semester.id, ...(q.courseId && { courseId: q.courseId }) },
      orderBy: [{ course: { name: 'asc' } }, { courseYear: 'asc' }, { name: 'asc' }],
      include: { course: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
    });
    return {
      semester: { id: semester.id, label: semester.label },
      items: rows.map((g) => ({ id: g.id, name: g.name, regime: g.regime, course: g.course, courseYear: g.courseYear, students: g._count.enrollments })),
    };
  }

  async create(dto: CreateClassGroupDto) {
    const [course, semester] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
      this.prisma.semester.findUnique({ where: { id: dto.semesterId } }),
    ]);
    if (!course || !semester) throw err(400, 'DADOS_INVALIDOS', 'Curso ou semestre inexistente.');
    const hasSubjects = await this.prisma.courseSubject.findFirst({ where: { courseId: course.id, courseYear: dto.courseYear } });
    if (!hasSubjects) throw err(400, 'ANO_SEM_CADEIRAS', 'Este curso não tem cadeiras registadas para esse ano curricular.');
    try {
      const g = await this.prisma.classGroup.create({ data: { ...dto, name: classGroupName(course.code, dto.courseYear, semester.number, dto.regime) } });
      return { id: g.id, name: g.name, regime: g.regime, courseId: g.courseId, courseYear: g.courseYear, semesterId: g.semesterId };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ code: 'TURMA_DUPLICADA', message: 'Já existe uma turma deste regime neste curso, ano e semestre.' });
      }
      throw e;
    }
  }

  async remove(id: string) {
    const g = await this.prisma.classGroup.findUnique({ where: { id }, include: { _count: { select: { enrollments: true } } } });
    if (!g) throw new NotFoundException('Turma não encontrada.');
    if (g._count.enrollments > 0) {
      throw new ConflictException({ code: 'TURMA_COM_ESTUDANTES', message: 'A turma tem estudantes matriculados. Muda-os de turma antes de a apagar.' });
    }
    await this.prisma.classGroup.delete({ where: { id } });
    return { ok: true };
  }

  private async groupOr404(id: string) {
    const g = await this.prisma.classGroup.findUnique({
      where: { id },
      include: { course: { select: { id: true, name: true } }, semester: { select: { id: true, label: true, number: true } } },
    });
    if (!g) throw new NotFoundException('Turma não encontrada.');
    return g;
  }

  /** Turma com os seus estudantes (matrículas nesta turma). */
  async detail(id: string) {
    const g = await this.groupOr404(id);
    const matriculas = await this.prisma.enrollment.findMany({
      where: { classGroupId: id },
      include: { student: { select: { id: true, name: true, studentNumber: true, email: true, status: true } } },
      orderBy: { student: { name: 'asc' } },
    });
    return {
      id: g.id,
      name: g.name,
      course: g.course,
      courseYear: g.courseYear,
      semester: { id: g.semester.id, label: g.semester.label },
      students: matriculas.map((m) => ({
        id: m.student.id,
        name: m.student.name,
        studentNumber: m.student.studentNumber,
        email: m.student.email,
        accountStatus: m.student.status,
        enrollmentStatus: m.status,
      })),
    };
  }

  /**
   * Estudantes que se podem adicionar a esta turma: do mesmo curso, com matrícula ACTIVA neste semestre
   * e ainda noutra turma (a matrícula passa para esta). Quem tem matrícula inactiva não aparece.
   */
  async candidates(id: string, q: CandidatesQueryDto) {
    const g = await this.groupOr404(id);
    const page = q.page ?? 0;
    const pageSize = q.pageSize ?? 30;
    const where: Prisma.EnrollmentWhereInput = {
      semesterId: g.semesterId,
      status: 'ACTIVE',
      classGroupId: { not: id },
      classGroup: { courseId: g.courseId },
      student: {
        role: 'STUDENT',
        ...(q.q && {
          OR: [
            { name: { contains: q.q, mode: 'insensitive' } },
            { studentNumber: { contains: q.q, mode: 'insensitive' } },
            { email: { contains: q.q, mode: 'insensitive' } },
          ],
        }),
      },
    };
    const [total, rows] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        orderBy: [{ student: { name: 'asc' } }, { id: 'asc' }],
        skip: page * pageSize,
        take: pageSize,
        include: {
          student: { select: { id: true, name: true, studentNumber: true, email: true } },
          classGroup: { select: { name: true, courseYear: true } },
        },
      }),
    ]);
    return {
      items: rows.map((m) => ({
        id: m.student.id,
        name: m.student.name,
        studentNumber: m.student.studentNumber,
        email: m.student.email,
        currentGroup: { name: m.classGroup.name, courseYear: m.classGroup.courseYear },
      })),
      total,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  /**
   * Passa um ou vários estudantes para esta turma. Regras (todas validadas antes de alterar seja o que for):
   * são estudantes, do mesmo curso da turma, com matrícula ACTIVA no semestre da turma. As cadeiras AUTO
   * são recalculadas para o ano da nova turma; as MANUAL mantêm-se.
   */
  async addStudents(id: string, studentIds: string[]) {
    const g = await this.groupOr404(id);
    const matriculas = await this.prisma.enrollment.findMany({
      where: { studentId: { in: studentIds }, semesterId: g.semesterId },
      include: { student: { select: { id: true, role: true } }, classGroup: { select: { courseId: true } } },
    });
    const byStudent = new Map(matriculas.map((m) => [m.studentId, m]));

    const invalid: { id: string; reason: string }[] = [];
    for (const sid of studentIds) {
      const m = byStudent.get(sid);
      if (!m || m.student.role !== 'STUDENT') invalid.push({ id: sid, reason: 'SEM_MATRICULA' });
      else if (m.status !== 'ACTIVE') invalid.push({ id: sid, reason: 'MATRICULA_INACTIVA' });
      else if (m.classGroup.courseId !== g.courseId) invalid.push({ id: sid, reason: 'OUTRO_CURSO' });
    }
    if (invalid.length) {
      throw new HttpException(
        { code: 'ESTUDANTES_INVALIDOS', message: 'Só podes adicionar estudantes do mesmo curso com matrícula activa neste semestre.', invalid },
        400,
      );
    }

    const toMove = studentIds.filter((sid) => byStudent.get(sid)!.classGroupId !== id);
    await this.prisma.$transaction(async (tx) => {
      for (const sid of toMove) {
        await tx.enrollment.update({ where: { studentId_semesterId: { studentId: sid, semesterId: g.semesterId } }, data: { classGroupId: id } });
        await syncAutoSubjects(tx, sid, { courseId: g.courseId, courseYear: g.courseYear, semesterId: g.semesterId, semester: { number: g.semester.number } });
      }
    });
    return { added: toMove.length, alreadyInGroup: studentIds.length - toMove.length, group: await this.detail(id) };
  }
}
