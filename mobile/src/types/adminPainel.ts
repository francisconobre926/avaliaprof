export interface EstatisticasAdmin {
  students: number; activeStudents: number; teachers: number; evaluations: number; participationRate: number;
  comments: Record<string, number>; openReports: number; pendingComments: number;
  currentSemester: { id: string; label: string } | null;
  evaluationsPerSemester: { semester: string; count: number }[];
  teachersWithEnoughEvaluations: number; minSample: number;
}
export interface Paginado<T> { items: T[]; total: number; hasMore: boolean }
export type EstadoComentario = 'PUBLISHED' | 'BLOCKED' | 'PENDING_REVIEW' | 'HIDDEN' | 'REMOVED';
export interface ComentarioMod { id: string; text: string; status: EstadoComentario; reason: string | null; reports: number; teacher: string; subject: string; semester: string }
export interface DenunciaMod { id: string; reason: string; status: string; createdAt: string; comment: { id: string; text: string; status: EstadoComentario; teacher: string } }
export interface SemestreAdmin { id: string; label: string; number: number; startsAt: string; endsAt: string; isCurrent: boolean }
export interface PeriodoAdmin {
  id: string; semester: { id: string; label: string }; opensAt: string; closesAt: string; status: 'OPEN' | 'CLOSED'; open: boolean;
  courses: { id: string; name: string }[]; courseSubjects: { id: string; name: string; course: string }[]; evaluations: number;
}
export interface EstruturaAdmin {
  courses: { id: string; name: string; code: string; subjects: number }[];
  departments: { id: string; name: string }[];
  subjects: { id: string; name: string; department: string; links: { id: string; courseId: string; course: string; courseYear: number; semesterNumber: number }[] }[];
  teachers: { id: string; name: string; department: string; subjectIds: string[]; account: { email: string; status: string } | null }[];
}
export interface UtilizadorAdmin { id: string; name: string; email: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN'; status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'; studentNumber: string | null }
export interface EntradaAuditoria { id: string; action: string; entity: string; entityId: string | null; actor: string; createdAt: string }
export interface ConviteDocente { email: string; code: string; expiresAt: string }
