/**
 * Sincronização da fila com `POST /sync/evaluations`.
 *  - FIFO, em lotes de 50; um só envio de cada vez (`aSincronizar`);
 *  - OK / DUPLICATE: a operação sai da fila;
 *  - REJECTED (ex.: período fechado) / CONFLICT (versão desactualizada): fica na fila com o motivo,
 *    para a interface mostrar e o estudante descartar ou tentar de novo;
 *  - falha de rede, timeout ou 5xx: nada se perde, a fila fica como estava e tenta-se mais tarde;
 *  - o servidor decide tudo (período pela sua hora); a hora do telemóvel nunca conta.
 */
import axios from 'axios';
import { api } from '../../service/api';
import { utilizadorOffline } from './contexto';
import { useOfflineStore } from './estado';
import { outbox, type ItemFila } from './outbox';

const LOTE = 50;

interface Resultado { status: 'OK' | 'DUPLICATE' | 'REJECTED' | 'CONFLICT'; code?: string; message?: string }

const paraOperacao = (i: ItemFila) =>
  i.op === 'create'
    ? { op: 'create', clientId: i.clientId, teacherId: i.payload.teacherId, courseSubjectId: i.payload.courseSubjectId, scores: i.payload.scores, comment: i.payload.comment }
    : i.op === 'update'
      ? { op: 'update', evaluationId: i.evaluationId, version: i.payload.version, patch: i.payload.patch, comment: i.payload.comment }
      : { op: 'delete', evaluationId: i.evaluationId };

let emCurso = false;

/** Devolve true se a fila ficou sem pendentes. */
export async function sincronizar(): Promise<boolean> {
  const userId = utilizadorOffline();
  if (!userId || emCurso) return false;
  emCurso = true;
  useOfflineStore.setState({ aSincronizar: true });
  let aplicou = false;
  try {
    for (;;) {
      const itens = await outbox.pendentes(userId, LOTE);
      if (itens.length === 0) return true;
      let resultados: Resultado[];
      try {
        const { data } = await api.post<{ results: Resultado[] }>('/sync/evaluations', { operations: itens.map(paraOperacao) });
        resultados = data.results;
      } catch (e) {
        // Rede em baixo, timeout, 5xx, 401: não se mexe na fila.
        if (axios.isAxiosError(e) && e.response && e.response.status >= 400 && e.response.status < 500 && e.response.status !== 401 && e.response.status !== 429) {
          // Pedido recusado por inteiro (ex.: validação): marca-se para o estudante ver, em vez de bloquear a fila.
          const corpo = e.response.data as { message?: string | string[] } | undefined;
          const msg = Array.isArray(corpo?.message) ? corpo?.message[0] : corpo?.message;
          for (const i of itens) await outbox.marcar(i.id, 'REJECTED', `HTTP_${e.response.status}`, msg ?? 'O servidor recusou esta operação.');
          aplicou = true;
          continue;
        }
        return false;
      }
      for (let k = 0; k < itens.length; k++) {
        const r = resultados[k];
        if (!r) continue; // sem resposta para esta: fica pendente
        if (r.status === 'OK' || r.status === 'DUPLICATE') await outbox.remover(itens[k].id);
        else await outbox.marcar(itens[k].id, r.status, r.code, r.message);
      }
      aplicou = true;
    }
  } finally {
    emCurso = false;
    useOfflineStore.setState(s => ({ aSincronizar: false, versaoDados: aplicou ? s.versaoDados + 1 : s.versaoDados }));
  }
}
