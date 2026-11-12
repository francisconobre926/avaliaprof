/**
 * Fila de saída (outbox). Regras:
 *  - cada operação pertence a um utilizador; nunca se mistura entre contas;
 *  - ordem FIFO; `create` leva o `clientId` do formulário (o servidor trata o reenvio como idempotente);
 *  - várias edições seguidas à mesma avaliação fundem-se numa só (mantendo a versão mais antiga, a que o servidor conhece);
 *  - apagar uma avaliação com edições pendentes descarta essas edições.
 */
import type { Notas } from '../types';
import { obterDb } from './db';
import { marcarFilaAlterada } from './estado';

export type EstadoFila = 'PENDING' | 'REJECTED' | 'CONFLICT';

export interface Rotulo { professor: string; cadeira: string }
export interface PayloadCriar extends Rotulo { teacherId: string; courseSubjectId: string; scores: Notas; comment?: string }
export interface PayloadEditar extends Rotulo { patch?: Partial<Notas>; comment?: string | null; version: number }
export type PayloadApagar = Rotulo;

export interface ItemFila {
  id: number;
  userId: string;
  op: 'create' | 'update' | 'delete';
  clientId: string | null;
  evaluationId: string | null;
  payload: PayloadCriar & PayloadEditar & PayloadApagar;
  status: EstadoFila;
  code: string | null;
  message: string | null;
  createdAt: number;
  attempts: number;
}

type Linha = Omit<ItemFila, 'payload'> & { payload: string };
const paraItem = (l: Linha): ItemFila => ({ ...l, payload: JSON.parse(l.payload) });

export const outbox = {
  async listar(userId: string): Promise<ItemFila[]> {
    const db = await obterDb();
    return (await db.getAllAsync<Linha>('SELECT * FROM outbox WHERE userId = ? ORDER BY id ASC', userId)).map(paraItem);
  },

  async pendentes(userId: string, limite: number): Promise<ItemFila[]> {
    const db = await obterDb();
    return (await db.getAllAsync<Linha>(
      "SELECT * FROM outbox WHERE userId = ? AND status = 'PENDING' ORDER BY id ASC LIMIT ?", userId, limite)).map(paraItem);
  },

  async criar(userId: string, clientId: string, p: PayloadCriar): Promise<void> {
    const db = await obterDb();
    // Mesmo clientId já na fila: não duplica.
    const ja = await db.getFirstAsync('SELECT id FROM outbox WHERE userId = ? AND clientId = ?', userId, clientId);
    if (!ja) {
      await db.runAsync('INSERT INTO outbox (userId, op, clientId, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
        userId, 'create', clientId, JSON.stringify(p), Date.now());
    }
    marcarFilaAlterada();
  },

  async editar(userId: string, evaluationId: string, p: PayloadEditar): Promise<void> {
    const db = await obterDb();
    const ant = await db.getFirstAsync<Linha>(
      "SELECT * FROM outbox WHERE userId = ? AND evaluationId = ? AND op = 'update' AND status = 'PENDING'", userId, evaluationId);
    if (ant) {
      const a = paraItem(ant).payload;
      const fundido: PayloadEditar = {
        ...p,
        patch: { ...a.patch, ...p.patch },
        comment: p.comment !== undefined ? p.comment : a.comment,
        version: a.version,
      };
      await db.runAsync('UPDATE outbox SET payload = ? WHERE id = ?', JSON.stringify(fundido), ant.id);
    } else {
      await db.runAsync('INSERT INTO outbox (userId, op, evaluationId, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
        userId, 'update', evaluationId, JSON.stringify(p), Date.now());
    }
    marcarFilaAlterada();
  },

  async apagar(userId: string, evaluationId: string, p: PayloadApagar): Promise<void> {
    const db = await obterDb();
    await db.runAsync("DELETE FROM outbox WHERE userId = ? AND evaluationId = ? AND op = 'update'", userId, evaluationId);
    const ja = await db.getFirstAsync('SELECT id FROM outbox WHERE userId = ? AND evaluationId = ? AND op = ?', userId, evaluationId, 'delete');
    if (!ja) {
      await db.runAsync('INSERT INTO outbox (userId, op, evaluationId, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
        userId, 'delete', evaluationId, JSON.stringify(p), Date.now());
    }
    marcarFilaAlterada();
  },

  async remover(id: number): Promise<void> {
    const db = await obterDb();
    await db.runAsync('DELETE FROM outbox WHERE id = ?', id);
    marcarFilaAlterada();
  },

  async marcar(id: number, status: EstadoFila, code?: string | null, message?: string | null): Promise<void> {
    const db = await obterDb();
    await db.runAsync('UPDATE outbox SET status = ?, code = ?, message = ?, attempts = attempts + 1 WHERE id = ?',
      status, code ?? null, message ?? null, id);
    marcarFilaAlterada();
  },

  /** "Tentar de novo": volta a PENDING. */
  async repor(id: number): Promise<void> {
    const db = await obterDb();
    await db.runAsync("UPDATE outbox SET status = 'PENDING', code = NULL, message = NULL WHERE id = ?", id);
    marcarFilaAlterada();
  },
};
