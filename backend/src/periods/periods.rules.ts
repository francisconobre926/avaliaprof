/** Regras puras dos períodos (sem dependências, para se testarem isoladamente). */

/** Regra única de "período aberto": estado OPEN e hora do SERVIDOR entre as datas. */
export const isEffectivelyOpen = (p: { status: string; opensAt: Date; closesAt: Date }, now = new Date()) =>
  p.status === 'OPEN' && p.opensAt <= now && now <= p.closesAt;

interface Scope {
  courses: { courseId: string }[];
  courseSubjects: { courseSubjectId: string }[];
}

/** Sem linhas de âmbito = todo o semestre; senão o curso ou a cadeira têm de constar. */
export const coversScope = (p: Scope, courseId: string, courseSubjectId: string) =>
  (p.courses.length === 0 && p.courseSubjects.length === 0) ||
  p.courses.some((c) => c.courseId === courseId) ||
  p.courseSubjects.some((c) => c.courseSubjectId === courseSubjectId);
