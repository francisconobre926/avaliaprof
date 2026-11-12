/**
 * Gestão de estudantes e turmas (só administrador; o servidor valida o papel em cada rota).
 * Nada aqui simula dados: tudo vem e vai para a API.
 */
import type {
  CadeiraDoEstudante, CandidatoTurma, DadosEstudante, EstadoConta, EstadoMatricula, EstudanteAdmin, EstudanteAdminDetalhe, OpcoesAcademicas,
  Pagina, Semestre, TurmaAdmin, TurmaDetalhe,
} from '../src/types';
import { api } from './api';
import { traduzirErro } from './erro';

export const TAMANHO_PAGINA_ADMIN = 15;

interface EstudanteApi {
  id: string;
  name: string;
  studentNumber: string | null;
  email: string;
  accountStatus: EstadoConta;
  course: { id: string; name: string } | null;
  enrollment: { status: EstadoMatricula; semester: Semestre; classGroup: { id: string; name: string }; courseYear: number } | null;
  subjects?: { courseSubjectId: string; name: string; courseYear: number; source: 'AUTO' | 'MANUAL'; teachers: { id: string; name: string }[] }[];
}

const paraEstudante = (e: EstudanteApi): EstudanteAdmin => ({
  id: e.id,
  nome: e.name,
  numero: e.studentNumber ?? '',
  email: e.email,
  estadoConta: e.accountStatus,
  curso: e.course && { id: e.course.id, nome: e.course.name },
  matricula: e.enrollment && {
    estado: e.enrollment.status,
    semestre: e.enrollment.semester,
    turma: { id: e.enrollment.classGroup.id, nome: e.enrollment.classGroup.name },
    ano: e.enrollment.courseYear,
  },
});

const paraDetalhe = (e: EstudanteApi): EstudanteAdminDetalhe => ({
  ...paraEstudante(e),
  cadeiras: (e.subjects ?? []).map(s => ({
    courseSubjectId: s.courseSubjectId,
    nome: s.name,
    anoCurso: s.courseYear,
    origem: s.source,
    docentes: s.teachers.map(t => ({ id: t.id, nome: t.name })),
  })),
});

const corpo = (d: DadosEstudante) => ({
  name: d.nome,
  studentNumber: d.numero,
  email: d.email,
  courseId: d.cursoId,
  courseYear: d.ano,
  semesterId: d.semestreId,
  classGroupId: d.turmaId,
  status: d.estado,
});

const run = async <T>(f: () => Promise<T>): Promise<T> => { try { return await f(); } catch (e) { throw traduzirErro(e); } };

export const adminService = {
  opcoes: () => run(async (): Promise<OpcoesAcademicas> => {
    const { data } = await api.get<{
      courses: { id: string; name: string; code: string; years: number[] }[];
      semesters: { id: string; label: string; number: number; isCurrent: boolean }[];
      classGroups: { id: string; name: string; courseId: string; courseYear: number; semesterId: string }[];
    }>('/admin/academic-options');
    return {
      cursos: data.courses.map(c => ({ id: c.id, nome: c.name, codigo: c.code, anos: c.years })),
      semestres: data.semesters.map(s => ({ id: s.id, rotulo: s.label, numero: s.number, corrente: s.isCurrent })),
      turmas: data.classGroups.map(t => ({ id: t.id, nome: t.name, cursoId: t.courseId, ano: t.courseYear, semestreId: t.semesterId })),
    };
  }),

  listarEstudantes: (f: { texto?: string; cursoId?: string; turmaId?: string; estado?: EstadoMatricula }, pagina = 0) =>
    run(async (): Promise<Pagina<EstudanteAdmin>> => {
      const { data } = await api.get<{ items: EstudanteApi[]; total: number; hasMore: boolean }>('/admin/students', {
        params: { q: f.texto || undefined, courseId: f.cursoId, classGroupId: f.turmaId, status: f.estado, page: pagina, pageSize: TAMANHO_PAGINA_ADMIN },
      });
      return { itens: data.items.map(paraEstudante), total: data.total, temMais: data.hasMore };
    }),

  obterEstudante: (id: string) => run(async () => paraDetalhe((await api.get<EstudanteApi>(`/admin/students/${id}`)).data)),
  criarEstudante: (d: DadosEstudante) => run(async () => paraDetalhe((await api.post<EstudanteApi>('/admin/students', corpo(d))).data)),
  atualizarEstudante: (id: string, d: DadosEstudante) => run(async () => paraDetalhe((await api.patch<EstudanteApi>(`/admin/students/${id}`, corpo(d))).data)),
  definirEstadoMatricula: (id: string, estado: EstadoMatricula) =>
    run(async () => paraDetalhe((await api.patch<EstudanteApi>(`/admin/students/${id}/enrollment`, { status: estado })).data)),

  cadeirasCandidatas: (id: string) => run(async (): Promise<Omit<CadeiraDoEstudante, 'origem'>[]> => {
    const { data } = await api.get<{ items: { courseSubjectId: string; name: string; courseYear: number; teachers: { id: string; name: string }[] }[] }>(
      `/admin/students/${id}/available-subjects`);
    return data.items.map(c => ({ courseSubjectId: c.courseSubjectId, nome: c.name, anoCurso: c.courseYear, docentes: c.teachers.map(t => ({ id: t.id, nome: t.name })) }));
  }),
  associarCadeira: (id: string, courseSubjectId: string) =>
    run(async () => paraDetalhe((await api.post<EstudanteApi>(`/admin/students/${id}/subjects`, { courseSubjectId })).data)),
  removerCadeira: (id: string, courseSubjectId: string) =>
    run(async () => paraDetalhe((await api.delete<EstudanteApi>(`/admin/students/${id}/subjects/${courseSubjectId}`)).data)),

  listarTurmas: (cursoId?: string) => run(async (): Promise<{ semestre: Semestre; itens: TurmaAdmin[] }> => {
    const { data } = await api.get<{ semester: Semestre; items: { id: string; name: string; course: { id: string; name: string }; courseYear: number; students: number }[] }>(
      '/admin/class-groups', { params: { courseId: cursoId } });
    return { semestre: data.semester, itens: data.items.map(t => ({ id: t.id, nome: t.name, curso: { id: t.course.id, nome: t.course.name }, ano: t.courseYear, estudantes: t.students })) };
  }),
  criarTurma: (d: { cursoId: string; ano: number; semestreId: string; regime: 'LABORAL' | 'POS_LABORAL' }) =>
    run(async () => { await api.post('/admin/class-groups', { courseId: d.cursoId, courseYear: d.ano, semesterId: d.semestreId, regime: d.regime }); }),
  detalheTurma: (id: string) => run(async (): Promise<TurmaDetalhe> => {
    const { data } = await api.get<{
      id: string; name: string; course: { id: string; name: string }; courseYear: number; semester: Semestre;
      students: { id: string; name: string; studentNumber: string | null; email: string; accountStatus: EstadoConta; enrollmentStatus: EstadoMatricula }[];
    }>(`/admin/class-groups/${id}`);
    return {
      id: data.id,
      nome: data.name,
      curso: { id: data.course.id, nome: data.course.name },
      ano: data.courseYear,
      semestre: data.semester,
      estudantes: data.students.map(e => ({
        id: e.id, nome: e.name, numero: e.studentNumber ?? '', email: e.email, estadoConta: e.accountStatus, estadoMatricula: e.enrollmentStatus,
      })),
    };
  }),

  /** Estudantes do mesmo curso com matrícula activa noutra turma (os únicos que se podem adicionar). */
  candidatosTurma: (id: string, texto: string, pagina = 0) => run(async (): Promise<Pagina<CandidatoTurma>> => {
    const { data } = await api.get<{
      items: { id: string; name: string; studentNumber: string | null; email: string; currentGroup: { name: string; courseYear: number } }[];
      total: number; hasMore: boolean;
    }>(`/admin/class-groups/${id}/candidates`, { params: { q: texto || undefined, page: pagina, pageSize: 30 } });
    return {
      itens: data.items.map(c => ({ id: c.id, nome: c.name, numero: c.studentNumber ?? '', email: c.email, turmaActual: { nome: c.currentGroup.name, ano: c.currentGroup.courseYear } })),
      total: data.total,
      temMais: data.hasMore,
    };
  }),

  /** Passa um ou vários estudantes para a turma. O servidor valida tudo antes de alterar (tudo ou nada). */
  adicionarEstudantesATurma: (id: string, estudanteIds: string[]) =>
    run(async () => (await api.post<{ added: number; alreadyInGroup: number }>(`/admin/class-groups/${id}/students`, { studentIds: estudanteIds })).data.added),

  apagarTurma: (id: string) => run(async () => { await api.delete(`/admin/class-groups/${id}`); }),
};
