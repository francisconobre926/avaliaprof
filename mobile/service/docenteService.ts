/** Área do docente (`/teacher/me/*`). Todos os dados vêm da conta autenticada; o servidor valida o papel. */
import type { EstatisticasProfessor } from '../src/types';
import type { CadeiraDocente, ComentarioDocente, FichaDocente, SessaoAvaliacao } from '../src/types/docente';
import { api } from './api';
import { paraEstatisticas, type EstatisticasApi } from './avaliacaoService';
import { urlAbsoluto } from './authService';
import { traduzirErro } from './erro';

interface SessaoApi {
  id: string; qrToken: string; subject: string; course: string; courseSubjectId: string;
  classGroup: { id: string; name: string } | null; opensAt: string; closesAt: string; status: SessaoAvaliacao['estado'];
}
const paraSessao = (s: SessaoApi): SessaoAvaliacao => ({
  id: s.id, token: s.qrToken, cadeira: s.subject, curso: s.course, cadeiraCursoId: s.courseSubjectId,
  turma: s.classGroup ? { id: s.classGroup.id, nome: s.classGroup.name } : null,
  abreEm: s.opensAt, fechaEm: s.closesAt, estado: s.status,
});

const MENSAGENS: Record<string, string> = {
  NAO_LECCIONA: 'Só podes criar sessões para cadeiras que lecciona.',
  PERIODO_FECHADO: 'O período de avaliação desta cadeira não está aberto.',
  FORA_DO_SEMESTRE: 'Esta cadeira não é leccionada no semestre corrente.',
  SEM_SEMESTRE_ACTUAL: 'Não há semestre em curso definido pela administração.',
};

async function chamar<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) {
    const t = traduzirErro(e);
    if (MENSAGENS[t.codigo]) t.message = MENSAGENS[t.codigo];
    throw t;
  }
}

export const docenteService = {
  ficha: (): Promise<FichaDocente> => chamar(async () => {
    const { data } = await api.get('/teacher/me');
    return {
      id: data.id, nome: data.name, foto: urlAbsoluto(data.photoUrl), departamento: data.department, codigoPublico: data.publicCode,
      cadeiras: data.subjects.map((s: { id: string; name: string; courseSubjects: { id: string; courseId: string; courseName: string; courseYear: number; semesterNumber: number }[] }): CadeiraDocente => ({
        id: s.id, nome: s.name,
        cursos: s.courseSubjects.map(c => ({ id: c.id, cursoId: c.courseId, cursoNome: c.courseName, ano: c.courseYear, semestre: c.semesterNumber })),
      })),
    };
  }),

  estatisticas: (cadeiraId?: string): Promise<EstatisticasProfessor> => chamar(async () => {
    const { data } = await api.get<EstatisticasApi>('/teacher/me/stats', { params: cadeiraId ? { subjectId: cadeiraId } : undefined });
    return paraEstatisticas(data);
  }),

  comentarios: (pagina: number, cadeiraId?: string) => chamar(async () => {
    const { data } = await api.get('/teacher/me/comments', { params: { page: pagina, pageSize: 10, ...(cadeiraId && { subjectId: cadeiraId }) } });
    return {
      itens: data.items.map((c: { id: string; text: string; reply: string | null; semester: string; subject: string }): ComentarioDocente =>
        ({ id: c.id, texto: c.text, resposta: c.reply, semestre: c.semester, cadeira: c.subject })),
      total: data.total as number,
      maisPaginas: data.hasMore as boolean,
    };
  }),

  responder: (comentarioId: string, texto: string) => chamar(async () => {
    try { await api.put(`/teacher/me/comments/${comentarioId}/reply`, { text: texto }); } catch (e) {
      const t = traduzirErro(e);
      if (t.codigo === 'RESPOSTA_REJEITADA') t.message = t.message || 'A resposta não cumpre as regras de conteúdo.';
      throw t;
    }
  }),
  apagarResposta: (comentarioId: string) => chamar(async () => { await api.delete(`/teacher/me/comments/${comentarioId}/reply`); }),

  sessoes: (): Promise<SessaoAvaliacao[]> => chamar(async () => (await api.get<{ items: SessaoApi[] }>('/teacher/me/sessions')).data.items.map(paraSessao)),
  criarSessao: (cadeiraCursoId: string, minutos: number): Promise<SessaoAvaliacao> =>
    chamar(async () => paraSessao((await api.post<SessaoApi>('/teacher/me/sessions', { courseSubjectId: cadeiraCursoId, minutes: minutos })).data)),
  encerrarSessao: (id: string): Promise<SessaoAvaliacao> =>
    chamar(async () => paraSessao((await api.post<SessaoApi>(`/teacher/me/sessions/${id}/close`)).data)),
};
