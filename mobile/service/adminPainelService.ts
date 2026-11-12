/** Painel do administrador (Fase 6): estatísticas, moderação, períodos, estrutura académica, utilizadores e auditoria. */
import type {
  ComentarioMod, ConviteDocente, DenunciaMod, EntradaAuditoria, EstadoComentario, EstatisticasAdmin, EstruturaAdmin, Paginado, PeriodoAdmin,
  SemestreAdmin, UtilizadorAdmin,
} from '../src/types/adminPainel';
import { api } from './api';
import { traduzirErro } from './erro';

const run = async <T>(f: () => Promise<T>): Promise<T> => { try { return await f(); } catch (e) { throw traduzirErro(e); } };
const get = <T>(url: string, params?: object) => run(async () => (await api.get<T>(url, { params })).data);

export interface DadosPeriodo { semesterId?: string; opensAt: string; closesAt: string; status: 'OPEN' | 'CLOSED'; courseIds: string[] }

export const adminPainelService = {
  estatisticas: () => get<EstatisticasAdmin>('/admin/stats'),

  comentarios: (status: string, page = 0) => get<Paginado<ComentarioMod>>('/admin/comments', { status, page }),
  definirComentario: (id: string, status: Exclude<EstadoComentario, 'BLOCKED' | 'PENDING_REVIEW'>) =>
    run(async () => (await api.patch(`/admin/comments/${id}`, { status })).data),
  denuncias: (status = 'OPEN', page = 0) => get<Paginado<DenunciaMod>>('/admin/reports', { status, page }),
  resolverDenuncia: (id: string, status: 'RESOLVED' | 'DISMISSED', hideComment = false) =>
    run(async () => (await api.patch(`/admin/reports/${id}`, { status, hideComment })).data),

  semestres: () => get<{ items: SemestreAdmin[] }>('/admin/semesters'),
  tornarCorrente: (id: string) => run(async () => (await api.post(`/admin/semesters/${id}/current`)).data),
  periodos: () => get<{ items: PeriodoAdmin[]; serverTime: string }>('/admin/periods'),
  criarPeriodo: (d: DadosPeriodo) => run(async () => (await api.post('/admin/periods', d)).data),
  atualizarPeriodo: (id: string, d: Omit<DadosPeriodo, 'semesterId'>) => run(async () => (await api.patch(`/admin/periods/${id}`, d)).data),
  apagarPeriodo: (id: string) => run(async () => (await api.delete(`/admin/periods/${id}`)).data),

  estrutura: () => get<EstruturaAdmin>('/admin/structure'),
  criarCurso: (name: string, code: string) => run(async () => (await api.post('/admin/courses', { name, code })).data),
  criarCadeira: (d: { name: string; departmentId: string; courseId?: string; courseYear?: number; semesterNumber?: number }) =>
    run(async () => (await api.post('/admin/subjects', d)).data),
  ligarCadeira: (id: string, d: { courseId: string; courseYear: number; semesterNumber: number }) =>
    run(async () => (await api.post(`/admin/subjects/${id}/courses`, d)).data),
  criarDocente: (d: { name: string; departmentId: string }) => run(async () => (await api.post('/admin/teachers', d)).data),
  definirCadeirasDocente: (id: string, subjectIds: string[]) => run(async () => (await api.post(`/admin/teachers/${id}/subjects`, { subjectIds })).data),
  convidarDocente: (id: string, email: string) => run(async () => (await api.post<ConviteDocente>(`/admin/teachers/${id}/invite`, { email })).data),

  utilizadores: (f: { role?: string; q?: string }, page = 0) => get<Paginado<UtilizadorAdmin>>('/admin/users', { role: f.role, q: f.q || undefined, page }),
  definirEstadoUtilizador: (id: string, status: 'ACTIVE' | 'SUSPENDED') => run(async () => (await api.patch(`/admin/users/${id}/status`, { status })).data),
  auditoria: (page = 0) => get<Paginado<EntradaAuditoria>>('/admin/audit', { page }),
};

/** Interpreta "AAAA-MM-DD HH:mm" (hora local) e devolve ISO, ou null se inválido. */
export { paraIso, deIso } from '../src/utils/datas';
