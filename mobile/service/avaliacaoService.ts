/**
 * Avaliações de docentes via API REST. As regras (inscrição, período aberto, unicidade,
 * moderação, anonimato, amostra mínima) são aplicadas no servidor; aqui só se traduz.
 */
import * as Crypto from 'expo-crypto';
import type {
  Avaliacao, ComentarioPublico, ElegibilidadeCadeira, EstadoComentario, EstatisticasProfessor, Notas, Pagina,
} from '../src/types';
import { comCache } from '../src/offline/cache';
import { api } from './api';
import { traduzirErro } from './erro';

interface AvaliacaoApi {
  id: string;
  clientId: string;
  version: number;
  teacher: { id: string; name: string };
  subject: { id: string; name: string };
  semester: { id: string; label: string };
  scores: Notas;
  overall: number;
  comment: { text: string; status: EstadoComentario; message: string | null } | null;
  editable: boolean;
}

const paraAvaliacao = (a: AvaliacaoApi): Avaliacao => ({
  id: a.id,
  clientId: a.clientId,
  versao: a.version,
  professor: { id: a.teacher.id, nome: a.teacher.name },
  cadeira: { id: a.subject.id, nome: a.subject.name },
  semestre: a.semester,
  notas: a.scores,
  media: a.overall,
  comentario: a.comment ? { texto: a.comment.text, estado: a.comment.status, mensagem: a.comment.message } : null,
  editavel: a.editable,
});

export type EstatisticasApi =
  | { sufficient: false; count: number; minSample: number }
  | { sufficient: true; count: number; minSample: number; average: number; criteria: Notas; distribution: Record<'1' | '2' | '3' | '4' | '5', number>; evolution: { semester: string; count: number; average: number | null }[] };

/** Traduz as estatísticas do servidor (docente ou agregadas) para o modelo da app. */
export function paraEstatisticas(data: EstatisticasApi): EstatisticasProfessor {
  if (!data.sufficient) return { suficiente: false, total: data.count, minimo: data.minSample };
  return {
    suficiente: true,
    total: data.count,
    minimo: data.minSample,
    media: data.average,
    criterios: data.criteria,
    distribuicao: data.distribution,
    evolucao: data.evolution.map(e => ({ semestre: e.semester, total: e.count, media: e.average })),
  };
}

export const avaliacaoService = {
  /** Identificador gerado no dispositivo: o servidor trata reenvios do mesmo pedido como idempotentes. */
  novoClientId: (): string => Crypto.randomUUID(),

  async elegibilidade(professorId: string): Promise<ElegibilidadeCadeira[]> {
    return comCache(`elegibilidade:${professorId}`, () => this.elegibilidadeServidor(professorId));
  },

  async elegibilidadeServidor(professorId: string): Promise<ElegibilidadeCadeira[]> {
    try {
      const { data } = await api.get<{
        items: { courseSubjectId: string; subjectName: string; canEvaluate: boolean; reason: ElegibilidadeCadeira['motivo']; evaluationId: string | null; periodClosesAt: string | null }[];
      }>(`/teachers/${professorId}/eligibility`);
      return data.items.map(i => ({
        courseSubjectId: i.courseSubjectId,
        cadeira: i.subjectName,
        podeAvaliar: i.canEvaluate,
        motivo: i.reason,
        avaliacaoId: i.evaluationId,
        fechaEm: i.periodClosesAt,
      }));
    } catch (e) { throw traduzirErro(e); }
  },

  async criar(dados: { clientId: string; professorId: string; courseSubjectId: string; notas: Notas; comentario?: string }): Promise<Avaliacao> {
    try {
      const { data } = await api.post<{ evaluation: AvaliacaoApi }>('/evaluations', {
        clientId: dados.clientId,
        teacherId: dados.professorId,
        courseSubjectId: dados.courseSubjectId,
        scores: dados.notas,
        comment: dados.comentario?.trim() || undefined,
      });
      return paraAvaliacao(data.evaluation);
    } catch (e) { throw traduzirErro(e); }
  },

  /** `comentario`: texto novo, `null` para apagar, `undefined` para não mexer. */
  async editar(id: string, dados: { notas?: Partial<Notas>; comentario?: string | null; versao?: number }): Promise<Avaliacao> {
    try {
      const { data } = await api.patch<AvaliacaoApi>(`/evaluations/${id}`, {
        scores: dados.notas,
        comment: dados.comentario,
        version: dados.versao,
      });
      return paraAvaliacao(data);
    } catch (e) { throw traduzirErro(e); }
  },

  async apagar(id: string): Promise<void> {
    try { await api.delete(`/evaluations/${id}`); } catch (e) { throw traduzirErro(e); }
  },

  async minhas(): Promise<Avaliacao[]> {
    return comCache('minhas-avaliacoes', () => this.minhasServidor());
  },

  async minhasServidor(): Promise<Avaliacao[]> {
    try { return (await api.get<{ items: AvaliacaoApi[] }>('/me/evaluations')).data.items.map(paraAvaliacao); } catch (e) { throw traduzirErro(e); }
  },

  async estatisticas(professorId: string): Promise<EstatisticasProfessor> {
    try {
      return paraEstatisticas((await api.get<EstatisticasApi>(`/teachers/${professorId}/stats`)).data);
    } catch (e) { throw traduzirErro(e); }
  },

  async comentarios(professorId: string, pagina = 0): Promise<Pagina<ComentarioPublico>> {
    try {
      const { data } = await api.get<{ items: { id: string; text: string; semester: string }[]; total: number; hasMore: boolean }>(
        `/teachers/${professorId}/comments`, { params: { page: pagina, pageSize: 5 } });
      return { itens: data.items.map(c => ({ id: c.id, texto: c.text, semestre: c.semester })), total: data.total, temMais: data.hasMore };
    } catch (e) { throw traduzirErro(e); }
  },
};
