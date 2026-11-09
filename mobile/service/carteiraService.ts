/**
 * Carteira (saldo + transacções).
 *
 * API esperada:
 *   GET /carteira → { saldo: number, transacoes: Transacao[] }
 *   PUT /carteira → grava o estado
 *
 * Fallback local: as mesmas chaves AsyncStorage que a app já usava (sem perda de dados).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transacao } from '../src/store/walletStore';
import { api, escreverComFallback, lerComFallback } from './fallback';

const KEY_SALDO = '@gohome_carteira_v2_saldo';
const KEY_TRANSACOES = '@gohome_carteira_v2_transacoes';

export interface EstadoCarteira { saldo: number; transacoes: Transacao[] }

async function lerLocal(): Promise<EstadoCarteira> {
  const [saldoRaw, transRaw] = await Promise.all([AsyncStorage.getItem(KEY_SALDO), AsyncStorage.getItem(KEY_TRANSACOES)]);
  const saldo = saldoRaw === null ? 0 : Number(saldoRaw);
  let transacoes: unknown = [];
  try { transacoes = transRaw ? JSON.parse(transRaw) : []; } catch { transacoes = []; }
  return { saldo: Number.isFinite(saldo) && saldo >= 0 ? saldo : 0, transacoes: normalizar(transacoes) };
}

function normalizar(valor: unknown): Transacao[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((t): t is Transacao => !!t && typeof t === 'object' && typeof t.id === 'string' && typeof t.valor === 'number');
}

const gravarLocal = (e: EstadoCarteira) =>
  Promise.all([
    AsyncStorage.setItem(KEY_SALDO, String(e.saldo)),
    AsyncStorage.setItem(KEY_TRANSACOES, JSON.stringify(e.transacoes)),
  ]).then(() => undefined);

export const carteiraService = {
  async carregar(): Promise<EstadoCarteira> {
    const { dados } = await lerComFallback<EstadoCarteira>({
      nome: 'carteira.carregar',
      remoto: async () => {
        const d = (await api.get('/carteira')).data;
        return { saldo: Number(d?.saldo), transacoes: normalizar(d?.transacoes) };
      },
      valido: e => Number.isFinite(e.saldo) && e.saldo >= 0,
      aoSucesso: gravarLocal,
      local: lerLocal,
    });
    return dados;
  },

  /** Guarda localmente (obrigatório) e sincroniza em segundo plano. Lança erro só se a gravação local falhar. */
  guardar: (estado: EstadoCarteira) =>
    escreverComFallback<void>({ nome: 'carteira.guardar', local: () => gravarLocal(estado), remoto: () => api.put('/carteira', estado) }),

  limpar: () =>
    escreverComFallback<void>({
      nome: 'carteira.limpar',
      local: () => Promise.all([AsyncStorage.removeItem(KEY_SALDO), AsyncStorage.removeItem(KEY_TRANSACOES)]).then(() => undefined),
      remoto: () => api.delete('/carteira'),
    }),
};
