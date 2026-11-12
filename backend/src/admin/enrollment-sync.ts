import type { Prisma } from '@prisma/client';

/**
 * Cadeiras AUTO de um estudante = as do curso, ano e semestre (1.º/2.º) da turma. Mantém as MANUAL
 * (ex.: cadeiras em atraso) e remove as AUTO que já não se aplicam. Partilhado pela gestão de
 * estudantes e pela gestão de turmas, para que a regra seja uma só.
 */
export async function syncAutoSubjects(
  tx: Prisma.TransactionClient,
  studentId: string,
  cg: { courseId: string; courseYear: number; semesterId: string; semester: { number: number } },
) {
  const wanted = await tx.courseSubject.findMany({
    where: { courseId: cg.courseId, courseYear: cg.courseYear, semesterNumber: cg.semester.number },
    select: { id: true },
  });
  const wantedIds = new Set(wanted.map((w) => w.id));
  const current = await tx.studentSubject.findMany({ where: { studentId, semesterId: cg.semesterId } });
  const toRemove = current.filter((c) => c.source === 'AUTO' && !wantedIds.has(c.courseSubjectId)).map((c) => c.id);
  if (toRemove.length) await tx.studentSubject.deleteMany({ where: { id: { in: toRemove } } });
  const have = new Set(current.map((c) => c.courseSubjectId));
  const toAdd = [...wantedIds].filter((id) => !have.has(id));
  if (toAdd.length) {
    await tx.studentSubject.createMany({
      data: toAdd.map((courseSubjectId) => ({ studentId, courseSubjectId, semesterId: cg.semesterId, source: 'AUTO' as const })),
    });
  }
}
