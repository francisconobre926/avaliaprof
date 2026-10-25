/**
 * src/store/walletStore.ts
 * Carteira GoHome com persistência em AsyncStorage.
 * O saldo começa em zero. O saque mínimo é de 100 MT.
 *
 * Compatibilidade: mantém o estado principal (saldo/transacoes) e uma
 * propriedade `carteira` para ecrãs antigos que ainda a utilizam.
 * Saldo pendente e créditos separados ainda não têm regras de negócio
 * implementadas; por isso permanecem a zero, sem inventar valores.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TipoTransacao =
  | 'credito'
  | 'debito'
  | 'compensacao'
  | 'referencia'
  | 'saque'
  | 'estorno';

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  valor: number;
  descricao: string;
  data: string;
  anuncioId?: string;
  categoria?: string;
  referencia?: string;
  estado?: 'pending' | 'approved' | 'rejected';
  numeroMPesa?: string;
}

export interface MetaCompensacao {
  anuncioId: string;
  tituloAnuncio: string;
  categoria: 'fecho_arrendado' | 'fecho_vendido' | 'fecho_reservado' | 'denuncia_valida';
}

export interface CarteiraCompatibilidade {
  saldoDisponivel: number;
  saldoPendente: number;
  saldoCreditos: number;
  transaccoes: Transacao[];
}

interface WalletState {
  saldo: number;
  transacoes: Transacao[];
  carregado: boolean;
  carteira: CarteiraCompatibilidade;

  carregarCarteira: () => Promise<void>;
  adicionarSaldo: (valor: number, descricao: string, tipo?: TipoTransacao) => Promise<void>;
  removerSaldo: (valor: number, descricao: string, tipo?: TipoTransacao) => Promise<boolean>;
  creditarCompensacao: (valor: number, descricao: string, meta: MetaCompensacao) => Promise<void>;
  sacar: (valor: number) => Promise<{ sucesso: boolean; erro?: string }>;
  limpar: () => Promise<void>;

  // Compatibilidade com ecrãs antigos; não representa integração real com M-Pesa.
  podeSacar: () => boolean;
  pedirSaque: (valor: number, numeroMPesa: string) => Promise<(Transacao & { sucesso: true }) | null>;
  simularAprovacaoSaque: (id: string) => Promise<void>;
  adicionarComissaoPendente: (valor: number, descricao: string) => Promise<void>;
  confirmarComissao: (id: string) => Promise<void>;
}

const KEY_SALDO = '@gohome_carteira_v2_saldo';
const KEY_TRANSACOES = '@gohome_carteira_v2_transacoes';
const SAQUE_MINIMO = 100;
const SALDO_INICIAL = 0;

function gerarId(): string {
  return `t${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizarTransacoes(valor: unknown): Transacao[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is Transacao =>
    !!item && typeof item === 'object' &&
    typeof (item as Transacao).id === 'string' &&
    typeof (item as Transacao).valor === 'number'
  );
}

function criarCarteira(saldo: number, transacoes: Transacao[]): CarteiraCompatibilidade {
  return {
    saldoDisponivel: Number.isFinite(saldo) ? saldo : 0,
    saldoPendente: 0,
    saldoCreditos: 0,
    transaccoes: transacoes,
  };
}

async function persistirSaldo(saldo: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_SALDO, String(saldo));
  } catch (err) {
    console.warn('[walletStore] Erro ao guardar saldo:', err);
    throw err;
  }
}

async function persistirTransacoes(transacoes: Transacao[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_TRANSACOES, JSON.stringify(transacoes));
  } catch (err) {
    console.warn('[walletStore] Erro ao guardar transacções:', err);
    throw err;
  }
}

function actualizarEstado(
  set: (partial: Partial<WalletState>) => void,
  saldo: number,
  transacoes: Transacao[],
  adicionais: Partial<WalletState> = {},
) {
  set({ saldo, transacoes, carteira: criarCarteira(saldo, transacoes), ...adicionais });
}

export const useWalletStore = create<WalletState>((set, get) => ({
  saldo: SALDO_INICIAL,
  transacoes: [],
  carregado: false,
  carteira: criarCarteira(SALDO_INICIAL, []),

  carregarCarteira: async () => {
    try {
      const [saldoRaw, transacoesRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_SALDO),
        AsyncStorage.getItem(KEY_TRANSACOES),
      ]);
      const saldoLido = saldoRaw === null ? SALDO_INICIAL : Number(saldoRaw);
      const saldo = Number.isFinite(saldoLido) && saldoLido >= 0 ? saldoLido : SALDO_INICIAL;
      let transacoes: Transacao[] = [];
      try {
        transacoes = normalizarTransacoes(transacoesRaw ? JSON.parse(transacoesRaw) : []);
      } catch {
        transacoes = [];
      }
      actualizarEstado(set, saldo, transacoes, { carregado: true });
    } catch (err) {
      console.warn('[walletStore] Erro ao carregar carteira:', err);
      actualizarEstado(set, SALDO_INICIAL, [], { carregado: true });
    }
  },

  adicionarSaldo: async (valor, descricao, tipo = 'credito') => {
    if (!Number.isFinite(valor) || valor <= 0) return;
    const estado = get();
    const novaTransacao: Transacao = {
      id: gerarId(), tipo, valor, descricao, data: new Date().toISOString(),
    };
    const novoSaldo = estado.saldo + valor;
    const novasTransacoes = [novaTransacao, ...estado.transacoes];
    await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
    actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
  },

  removerSaldo: async (valor, descricao, tipo = 'debito') => {
    if (!Number.isFinite(valor) || valor <= 0) return false;
    const estado = get();
    if (estado.saldo < valor) return false;
    const novaTransacao: Transacao = {
      id: gerarId(), tipo, valor: -valor, descricao, data: new Date().toISOString(),
    };
    const novoSaldo = estado.saldo - valor;
    const novasTransacoes = [novaTransacao, ...estado.transacoes];
    await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
    actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
    return true;
  },

  creditarCompensacao: async (valor, descricao, meta) => {
    if (!Number.isFinite(valor) || valor <= 0) return;
    const estado = get();
    const novaTransacao: Transacao = {
      id: gerarId(), tipo: 'compensacao', valor, descricao,
      data: new Date().toISOString(), anuncioId: meta.anuncioId, categoria: meta.categoria,
    };
    const novoSaldo = estado.saldo + valor;
    const novasTransacoes = [novaTransacao, ...estado.transacoes];
    await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
    actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
  },

  sacar: async (valor) => {
    if (!Number.isFinite(valor) || valor < SAQUE_MINIMO) {
      return { sucesso: false, erro: `O saque mínimo é ${SAQUE_MINIMO} MT.` };
    }
    const estado = get();
    if (estado.saldo < valor) return { sucesso: false, erro: 'Saldo insuficiente.' };
    const transacao: Transacao = {
      id: gerarId(), tipo: 'saque', valor: -valor,
      descricao: 'Pedido de levantamento (protótipo)', data: new Date().toISOString(),
    };
    const novoSaldo = estado.saldo - valor;
    const novasTransacoes = [transacao, ...estado.transacoes];
    try {
      await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
      actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
      return { sucesso: true };
    } catch {
      return { sucesso: false, erro: 'Não foi possível guardar a operação. Tenta novamente.' };
    }
  },

  pedirSaque: async (valor, numeroMPesa) => {
    if (!Number.isFinite(valor) || valor < SAQUE_MINIMO || valor > get().saldo || !numeroMPesa) return null;
    const transacao: Transacao = {
      id: gerarId(), tipo: 'saque', valor: -valor,
      descricao: `Pedido de saque para M-Pesa (+258 ${numeroMPesa})`,
      data: new Date().toISOString(), estado: 'pending', numeroMPesa,
    };
    const estado = get();
    const novoSaldo = estado.saldo - valor;
    const novasTransacoes = [transacao, ...estado.transacoes];
    try {
      await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
      actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
      return { ...transacao, sucesso: true as const };
    } catch {
      return null;
    }
  },

  simularAprovacaoSaque: async (id) => {
    const novasTransacoes = get().transacoes.map(t =>
      t.id === id ? { ...t, estado: 'approved' as const } : t
    );
    await persistirTransacoes(novasTransacoes);
    actualizarEstado(set, get().saldo, novasTransacoes, { carregado: true });
  },

  // Comissão de referência: fica pendente até o pagamento do convidado ser confirmado.
  adicionarComissaoPendente: async (valor, descricao) => {
    if (!Number.isFinite(valor) || valor <= 0) return;
    const transacao: Transacao = {
      id: gerarId(), tipo: 'referencia', valor, descricao,
      data: new Date().toISOString(), estado: 'pending',
    };
    const novasTransacoes = [transacao, ...get().transacoes];
    await persistirTransacoes(novasTransacoes);
    actualizarEstado(set, get().saldo, novasTransacoes, { carregado: true });
  },

  confirmarComissao: async (id) => {
    const estado = get();
    const transacao = estado.transacoes.find(t => t.id === id);
    if (!transacao || transacao.tipo !== 'referencia' || transacao.estado !== 'pending') return;
    const novoSaldo = estado.saldo + transacao.valor;
    const novasTransacoes = estado.transacoes.map(t =>
      t.id === id ? { ...t, estado: 'approved' as const } : t
    );
    await Promise.all([persistirSaldo(novoSaldo), persistirTransacoes(novasTransacoes)]);
    actualizarEstado(set, novoSaldo, novasTransacoes, { carregado: true });
  },

  podeSacar: () => get().saldo >= SAQUE_MINIMO,

  limpar: async () => {
    await Promise.all([AsyncStorage.removeItem(KEY_SALDO), AsyncStorage.removeItem(KEY_TRANSACOES)]);
    actualizarEstado(set, SALDO_INICIAL, [], { carregado: true });
  },
}));

// Helpers usados pelos ecrãs da aplicação.
export function formatarValor(valor: number | null | undefined): string {
  const numero = Number(valor ?? 0);
  return `${(Number.isFinite(numero) ? numero : 0).toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

export function labelTipoTransacao(tipo: TipoTransacao): string {
  const labels: Record<TipoTransacao, string> = {
    credito: 'Crédito', debito: 'Débito', compensacao: 'Compensação',
    referencia: 'Comissão de referência', saque: 'Levantamento', estorno: 'Estorno',
  };
  return labels[tipo] ?? 'Transacção';
}

export function iconeTipoTransacao(tipo: TipoTransacao): string {
  const icons: Record<TipoTransacao, string> = {
    credito: 'arrow-down-circle-outline', debito: 'arrow-up-circle-outline',
    compensacao: 'gift-outline', referencia: 'account-multiple-outline',
    saque: 'bank-transfer-out', estorno: 'undo',
  };
  return icons[tipo] ?? 'cash';
}

export function corTipoTransacao(tipo: TipoTransacao): string {
  const cores: Record<TipoTransacao, string> = {
    credito: '#2E7D32', debito: '#D32F2F', compensacao: '#1976D2',
    referencia: '#9C27B0', saque: '#F57C00', estorno: '#9E9E9E',
  };
  return cores[tipo] ?? '#666666';
}

export function tempoRelativo(dataISO: string): string {
  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return 'Data indisponível';
  const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
  if (segundos < 60) return 'Agora';
  if (segundos < 3600) return `Há ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `Há ${Math.floor(segundos / 3600)} h`;
  if (segundos < 604800) return `Há ${Math.floor(segundos / 86400)} dias`;
  return data.toLocaleDateString('pt-MZ');
}

// Aliases para manter compatibilidade com imports antigos.
export const labelTipoTransaccao = labelTipoTransacao;
export const iconeTransaccao = iconeTipoTransacao;
