/** Leitura de QR Codes. O QR só identifica; quem decide se se pode avaliar é o servidor. */
import { api } from './api';
import { ErroServico, traduzirErro } from './erro';

export type MotivoBloqueio = 'JA_AVALIADO' | 'PERIODO_FECHADO' | null;

export interface ItemQr {
  courseSubjectId: string;
  subjectName: string;
  canEvaluate: boolean;
  reason: MotivoBloqueio;
  evaluationId: string | null;
  periodClosesAt: string | null;
}

export interface ResultadoQr {
  kind: 'TEACHER' | 'SESSION';
  teacher: { id: string; name: string };
  semester: { id: string; label: string };
  items: ItemQr[];
  sessionClosesAt?: string;
}

import { interpretarQr, type AlvoQr } from '../src/utils/qr';

export { interpretarQr };
export type { AlvoQr };

const MENSAGENS: Record<string, string> = {
  QR_INVALIDO: 'Este QR Code não é válido.',
  SESSAO_ENCERRADA: 'O docente já encerrou esta sessão de avaliação.',
  SESSAO_EXPIRADA: 'Esta sessão de avaliação já expirou.',
  FORA_DA_TURMA: 'Esta sessão é de outra turma.',
  NAO_INSCRITO: 'Não estás inscrito nesta cadeira.',
  NAO_MATRICULADO: 'Ainda não tens matrícula neste semestre. Contacta a administração.',
  MATRICULA_INACTIVA: 'A tua matrícula não está activa. Contacta a administração.',
};

const traduzir = (e: unknown): ErroServico => {
  const err = traduzirErro(e);
  return new ErroServico(err.codigo, MENSAGENS[err.codigo] ?? err.message);
};

export const qrService = {
  async porProfessor(codigo: string): Promise<ResultadoQr> {
    try { return (await api.get<ResultadoQr>(`/qr/teacher/${encodeURIComponent(codigo)}`)).data; } catch (e) { throw traduzir(e); }
  },
  async porSessao(token: string): Promise<ResultadoQr> {
    try { return (await api.get<ResultadoQr>(`/qr/session/${encodeURIComponent(token)}`)).data; } catch (e) { throw traduzir(e); }
  },
};
