import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { syncAutoSubjects } from './enrollment-sync';
import { AddSubjectDto, CreateStudentDto, EnrollmentStatusDto, StudentsQueryDto, UpdateStudentDto } from './admin-students.dto';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);

type Tx = Prisma.TransactionClient;

const studentInclude = (semesterId: string) => ({
  course: { select: { id: true, name: true } },
  matriculas: {
    where: { semesterId },
    include: { classGroup: { select: { id: true, name: true, courseYear: true, courseId: true } }, semester: { select: { id: true, label: true } } },
  },
}) satisfies Prisma.UserInclude;
type StudentRow = Prisma.UserGetPayload<{ include: ReturnType<typeof studentInclude> }>;

@Injectable()
export class AdminStudentsService {
  constructor(private prisma: PrismaService) {}

  private async semesterOrCurrent(semesterId?: string) {
    const semester = semesterId
      ? await this.prisma.semester.findUnique({ where: { id: semesterId } })
      : await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) throw err(409, 'SEM_SEMESTRE', semesterId ? 'Semestre inexistente.' : 'Não há semestre corrente definido.');
    return semester;
  }

  private shape(u: StudentRow) {
    const m = u.matriculas[0];
    return {
      id: u.id,
      name: u.name,
      studentNumber: u.studentNumber,
      email: u.email,
      accountStatus: u.status,
      course: u.course,
      enrollment: m
        ? { status: m.status, semester: m.semester, classGroup: { id: m.classGroup.id, name: m.classGroup.name }, courseYear: m.classGroup.courseYear }
        : null,
    };
  }

  /** A turma tem de coincidir com o curso, ano e semestre indicados (consistência dos dados académicos). */
  private async validClassGroup(dto: { courseId?: string; courseYear?: number; semesterId?: string; classGroupId: string }) {
    const cg = await this.prisma.classGroup.findUnique({ where: { id: dto.classGroupId }, include: { semester: true } });
    if (!cg) throw err(400, 'TURMA_INEXISTENTE', 'A turma indicada não existe.');
    if (
      (dto.courseId && dto.courseId !== cg.courseId) ||
      (dto.courseYear !== undefined && dto.courseYear !== cg.courseYear) ||
      (dto.semesterId && dto.semesterId !== cg.semesterId)
    ) {
      throw err(400, 'TURMA_INCONSISTENTE', 'A turma não pertence ao curso, ano e semestre seleccionados.');
    }
    return cg;
  }

  private async assertUnique(email?: string, studentNumber?: string, exceptId?: string) {
    const [byEmail, byNumber] = await Promise.all([
      email ? this.prisma.user.findUnique({ where: { email } }) : null,
      studentNumber ? this.prisma.user.findUnique({ where: { studentNumber } }) : null,
    ]);
    if (byEmail && byEmail.id !== exceptId) throw new ConflictException({ code: 'EMAIL_EXISTENTE', message: 'Já existe um utilizador com este email.' });
    if (byNumber && byNumber.id !== exceptId) throw new ConflictException({ code: 'NUMERO_EXISTENTE', message: 'Já existe um estudante com este número.' });
  }

  async list(q: StudentsQueryDto) {
    const semester = await this.semesterOrCurrent(q.semesterId);
    const page = q.page ?? 0;
    const pageSize = q.pageSize ?? 15;
    const matricula: Prisma.EnrollmentWhereInput = {
      semesterId: semester.id,
      ...(q.classGroupId && { classGroupId: q.classGroupId }),
      ...(q.status && { status: q.status }),
      ...(q.courseId && { classGroup: { courseId: q.courseId } }),
    };
    const filtraMatricula = !!(q.classGroupId || q.status);
    const where: Prisma.UserWhereInput = {
      role: 'STUDENT',
      ...(q.q && {
        OR: [
          { name: { contains: q.q, mode: 'insensitive' } },
          { studentNumber: { contains: q.q, mode: 'insensitive' } },
          { email: { contains: q.q, mode: 'insensitive' } },
        ],
      }),
      ...(filtraMatricula ? { matriculas: { some: matricula } } : q.courseId ? { courseId: q.courseId } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: page * pageSize,
        take: pageSize,
        include: studentInclude(semester.id),
      }),
    ]);
    return { semester: { id: semester.id, label: semester.label }, items: rows.map((r) => this.shape(r)), total, hasMore: (page + 1) * pageSize < total };
  }

  async get(id: string, semesterId?: string) {
    const semester = await this.semesterOrCurrent(semesterId);
    const u = await this.prisma.user.findFirst({ where: { id, role: 'STUDENT' }, include: studentInclude(semester.id) });
    if (!u) throw new NotFoundException('Estudante não encontrado.');
    const subjects = await this.prisma.studentSubject.findMany({
      where: { studentId: id, semesterId: semester.id },
      include: { courseSubject: { include: { subject: { select: { name: true, teachers: { select: { teacher: { select: { id: true, name: true } } } } } } } } },
      orderBy: { courseSubject: { subject: { name: 'asc' } } },
    });
    return {
      ...this.shape(u),
      subjects: subjects.map((s) => ({
        courseSubjectId: s.courseSubjectId,
        name: s.courseSubject.subject.name,
        courseYear: s.courseSubject.courseYear,
        source: s.source,
        teachers: s.courseSubject.subject.teachers.map((t) => t.teacher),
      })),
    };
  }

  /** Cadastro manual: cria a conta (pendente, sem senha), a matrícula e as cadeiras da turma. */
  async create(dto: CreateStudentDto) {
    const cg = await this.validClassGroup(dto);
    await this.assertUnique(dto.email, dto.studentNumber);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: { name: dto.name, email: dto.email, studentNumber: dto.studentNumber, courseId: cg.courseId, role: 'STUDENT', status: 'PENDING', password: null },
        });
        await tx.enrollment.create({ data: { studentId: u.id, semesterId: cg.semesterId, classGroupId: cg.id, status: dto.status ?? 'ACTIVE' } });
        await syncAutoSubjects(tx, u.id, cg);
        return u;
      });
      return this.get(user.id, cg.semesterId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ code: 'ESTUDANTE_DUPLICADO', message: 'Já existe um estudante com este email ou número.' });
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
    if (!existing) throw new NotFoundException('Estudante não encontrado.');
    await this.assertUnique(dto.email, dto.studentNumber, id);

    const cg = dto.classGroupId ? await this.validClassGroup({ ...dto, classGroupId: dto.classGroupId }) : null;
    if ((dto.courseId || dto.courseYear !== undefined || dto.semesterId) && !cg) {
      throw err(400, 'TURMA_EM_FALTA', 'Para mudar curso, ano ou semestre indica também a turma.');
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { name: dto.name, email: dto.email, studentNumber: dto.studentNumber, ...(cg && { courseId: cg.courseId }) },
        });
        if (cg) {
          await tx.enrollment.upsert({
            where: { studentId_semesterId: { studentId: id, semesterId: cg.semesterId } },
            update: { classGroupId: cg.id, ...(dto.status && { status: dto.status }) },
            create: { studentId: id, semesterId: cg.semesterId, classGroupId: cg.id, status: dto.status ?? 'ACTIVE' },
          });
          await syncAutoSubjects(tx, id, cg);
        } else if (dto.status) {
          const sem = await this.semesterOrCurrent();
          const r = await tx.enrollment.updateMany({ where: { studentId: id, semesterId: sem.id }, data: { status: dto.status } });
          if (r.count === 0) throw err(409, 'SEM_MATRICULA', 'O estudante não tem matrícula neste semestre. Indica a turma.');
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ code: 'ESTUDANTE_DUPLICADO', message: 'Já existe um estudante com este email ou número.' });
      }
      throw e;
    }
    return this.get(id, cg?.semesterId);
  }

  /** Activar/desactivar a matrícula. Desactivar mantém as cadeiras mas bloqueia consulta e avaliação. */
  async setEnrollmentStatus(id: string, dto: EnrollmentStatusDto) {
    const semester = await this.semesterOrCurrent(dto.semesterId);
    const r = await this.prisma.enrollment.updateMany({ where: { studentId: id, semesterId: semester.id }, data: { status: dto.status } });
    if (r.count === 0) {
      if (!(await this.prisma.user.findFirst({ where: { id, role: 'STUDENT' }, select: { id: true } }))) throw new NotFoundException('Estudante não encontrado.');
      throw err(409, 'SEM_MATRICULA', 'O estudante não tem matrícula neste semestre.');
    }
    return this.get(id, semester.id);
  }

  private async enrolledContext(studentId: string, semesterId?: string) {
    const semester = await this.semesterOrCurrent(semesterId);
    const m = await this.prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId, semesterId: semester.id } },
      include: { classGroup: true },
    });
    if (!m) throw err(409, 'SEM_MATRICULA', 'O estudante não tem matrícula neste semestre.');
    return { semester, courseId: m.classGroup.courseId };
  }

  /** Associa manualmente uma cadeira (ex.: cadeira em atraso) do curso do estudante, do semestre (1.º/2.º) em causa. */
  async addSubject(studentId: string, dto: AddSubjectDto) {
    const { semester, courseId } = await this.enrolledContext(studentId, dto.semesterId);
    const cs = await this.prisma.courseSubject.findFirst({ where: { id: dto.courseSubjectId, courseId, semesterNumber: semester.number } });
    if (!cs) throw err(400, 'CADEIRA_INVALIDA', 'A cadeira não pertence ao curso do estudante neste semestre.');
    await this.prisma.studentSubject.upsert({
      where: { studentId_courseSubjectId_semesterId: { studentId, courseSubjectId: cs.id, semesterId: semester.id } },
      update: {},
      create: { studentId, courseSubjectId: cs.id, semesterId: semester.id, source: 'MANUAL' },
    });
    return this.get(studentId, semester.id);
  }

  async removeSubject(studentId: string, courseSubjectId: string, semesterId?: string) {
    const semester = await this.semesterOrCurrent(semesterId);
    const r = await this.prisma.studentSubject.deleteMany({ where: { studentId, courseSubjectId, semesterId: semester.id } });
    if (r.count === 0) throw new NotFoundException('Esta cadeira não está associada ao estudante.');
    return this.get(studentId, semester.id);
  }

  /** Cadeiras do curso do estudante, no semestre (1.º/2.º) corrente, ainda não associadas: candidatas a associação manual. */
  async availableSubjects(studentId: string, semesterId?: string) {
    const { semester, courseId } = await this.enrolledContext(studentId, semesterId);
    const [all, mine] = await Promise.all([
      this.prisma.courseSubject.findMany({
        where: { courseId, semesterNumber: semester.number },
        include: { subject: { select: { name: true, teachers: { select: { teacher: { select: { id: true, name: true } } } } } } },
        orderBy: [{ courseYear: 'asc' }, { subject: { name: 'asc' } }],
      }),
      this.prisma.studentSubject.findMany({ where: { studentId, semesterId: semester.id }, select: { courseSubjectId: true } }),
    ]);
    const have = new Set(mine.map((m) => m.courseSubjectId));
    return {
      items: all.filter((c) => !have.has(c.id)).map((c) => ({
        courseSubjectId: c.id,
        name: c.subject.name,
        courseYear: c.courseYear,
        teachers: c.subject.teachers.map((t) => t.teacher),
      })),
    };
  }
}
