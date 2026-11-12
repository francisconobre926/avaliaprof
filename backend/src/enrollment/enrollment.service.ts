import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Vista do estudante sobre as suas cadeiras. Só leitura: a matrícula, a turma e as cadeiras
 * são atribuídas pelo administrador. Sem matrícula activa não há cadeiras para mostrar.
 */
@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async mine(userId: string) {
    const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) {
      throw new ConflictException({ code: 'SEM_SEMESTRE_ACTUAL', message: 'Não há semestre em curso definido pela administração.' });
    }
    const matricula = await this.prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId: userId, semesterId: semester.id } },
      include: { classGroup: { include: { course: { select: { id: true, name: true } } } } },
    });
    const base = { semester: { id: semester.id, label: semester.label } };
    if (!matricula) return { ...base, enrollment: null, items: [] };

    const enrollment = {
      status: matricula.status,
      course: matricula.classGroup.course,
      courseYear: matricula.classGroup.courseYear,
      classGroup: { id: matricula.classGroup.id, name: matricula.classGroup.name },
    };
    if (matricula.status !== 'ACTIVE') return { ...base, enrollment, items: [] };

    const rows = await this.prisma.studentSubject.findMany({
      where: { studentId: userId, semesterId: semester.id },
      include: {
        courseSubject: {
          include: { subject: { select: { id: true, name: true, teachers: { select: { teacher: { select: { id: true, name: true } } } } } } },
        },
      },
      orderBy: [{ courseSubject: { courseYear: 'asc' } }, { courseSubject: { subject: { name: 'asc' } } }],
    });
    return {
      ...base,
      enrollment,
      items: rows.map((r) => ({
        courseSubjectId: r.courseSubjectId,
        subjectId: r.courseSubject.subject.id,
        name: r.courseSubject.subject.name,
        courseYear: r.courseSubject.courseYear,
        teachers: r.courseSubject.subject.teachers.map((t) => t.teacher),
      })),
    };
  }
}
