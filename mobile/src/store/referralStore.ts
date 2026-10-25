import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// TIPOS
// ============================================================

export type EstadoConvidado =
  | 'cadastrado'       // Criou conta mas ainda não pagou
  | 'pagou_pendente'   // Pagou, mas transacção ainda em pending
  | 'pagou_confirmado' // Pagou e confirmado — comissão move para disponível
  | 'reversed';        // Pagamento revertido — comissão cancelada

export interface Convidado {
  id: string;
  nome: string;
  papel: 'procurador' | 'anunciante';
  cadastradoEm: string;
  estado: EstadoConvidado;
  totalPago: number;         // Total que esta pessoa pagou
  comissaoGerada: number;    // Total que ganhei dela
  ultimaActividade: string;
}

export interface ReferralState {
  // Código do utilizador
  meuCodigo: string;
  meuLink: string;
  convidadoPor: string | null;   // Código de quem me convidou (se aplicável)

  // Lista de pessoas convidadas
  convidados: Convidado[];

  // Estatísticas calculadas
  carregado: boolean;

  // Actions
  gerarMeuCodigo: (nome: string) => Promise<void>;
  adicionarConvidado: (nome: string, papel: 'procurador' | 'anunciante') => Promise<void>;
  marcarComoPago: (convidadoId: string, valorPago: number) => Promise<{ comissao: number } | null>;
  confirmarPagamento: (convidadoId: string) => Promise<{ comissao: number } | null>;
  reverterPagamento: (convidadoId: string) => Promise<void>;

  // Persistência
  carregarReferencia: () => Promise<void>;
  resetReferencia: () => Promise<void>;

  // Getters
  getTotalGanho: () => number;
  getTotalPendente: () => number;
  getTotalConvidados: () => number;
  getConvidadosQuePagaram: () => number;
  getTaxaConversao: () => number;
}

const CHAVE_REFERENCIA = '@gohome_referencia_v2';

// ============================================================
// HELPERS
// ============================================================

/**
 * Gera código baseado no nome do utilizador
 * Exemplo: "Fernando Camunga" → "FERNANDO2026"
 */
function gerarCodigoDeNome(nome: string): string {
  const primeiroNome = nome.trim().split(' ')[0] || 'USER';
  const normalizado = primeiroNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  const ano = new Date().getFullYear();
  return `${normalizado}${ano}`;
}

/**
 * Comissão por tipo de transacção (DDR §22-25)
 */
export function calcularComissao(valorPago: number, tipoReferido: 'procurador' | 'anunciante'): number {
  // Procurador indicando outro procurador: 5 MT por desbloqueio (DDR §23)
  if (tipoReferido === 'procurador' && valorPago <= 50) {
    return valorPago >= 25 && valorPago < 50 ? 2.5 : 5;
  }
  // Qualquer outra combinação: 10% (DDR §24)
  return Math.round(valorPago * 0.1 * 100) / 100;
}

const persistir = async (estado: Partial<ReferralState>) => {
  try {
    await AsyncStorage.setItem(CHAVE_REFERENCIA, JSON.stringify(estado));
  } catch (e) {
    console.warn('Erro ao persistir referência:', e);
  }
};

// ============================================================
// DADOS MOCK (3 convidados visuais, 0 MT em dinheiro)
// ============================================================

const diasAtras = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
};

const convidadosMock: Convidado[] = [
  {
    id: 'c001',
    nome: 'João Mocombe',
    papel: 'procurador',
    cadastradoEm: diasAtras(2),
    estado: 'cadastrado',
    totalPago: 0,
    comissaoGerada: 0,
    ultimaActividade: diasAtras(2),
  },
  {
    id: 'c002',
    nome: 'Ana Mahanjane',
    papel: 'anunciante',
    cadastradoEm: diasAtras(5),
    estado: 'cadastrado',
    totalPago: 0,
    comissaoGerada: 0,
    ultimaActividade: diasAtras(5),
  },
  {
    id: 'c003',
    nome: 'Pedro Nhantumbo',
    papel: 'procurador',
    cadastradoEm: diasAtras(7),
    estado: 'cadastrado',
    totalPago: 0,
    comissaoGerada: 0,
    ultimaActividade: diasAtras(7),
  },
];

// ============================================================
// STORE
// ============================================================

export const useReferralStore = create<ReferralState>((set, get) => ({
  meuCodigo: '',
  meuLink: '',
  convidadoPor: null,
  convidados: convidadosMock,
  carregado: false,

  gerarMeuCodigo: async (nome) => {
    const codigo = gerarCodigoDeNome(nome);
    const link = `https://gohome.co.mz/convite/${codigo}`;

    set({ meuCodigo: codigo, meuLink: link });

    await persistir({
      meuCodigo: codigo,
      meuLink: link,
      convidadoPor: get().convidadoPor,
      convidados: get().convidados,
    });
  },

  adicionarConvidado: async (nome, papel) => {
    const novo: Convidado = {
      id: `c${Date.now()}`,
      nome,
      papel,
      cadastradoEm: new Date().toISOString(),
      estado: 'cadastrado',
      totalPago: 0,
      comissaoGerada: 0,
      ultimaActividade: new Date().toISOString(),
    };

    const convidados = [novo, ...get().convidados];
    set({ convidados });

    await persistir({
      meuCodigo: get().meuCodigo,
      meuLink: get().meuLink,
      convidadoPor: get().convidadoPor,
      convidados,
    });
  },

  marcarComoPago: async (convidadoId, valorPago) => {
    const convidado = get().convidados.find(c => c.id === convidadoId);
    if (!convidado) return null;

    const comissao = calcularComissao(valorPago, convidado.papel);

    const convidadosActualizados = get().convidados.map(c =>
      c.id === convidadoId
        ? {
            ...c,
            estado: 'pagou_pendente' as EstadoConvidado,
            totalPago: c.totalPago + valorPago,
            comissaoGerada: c.comissaoGerada + comissao,
            ultimaActividade: new Date().toISOString(),
          }
        : c
    );

    set({ convidados: convidadosActualizados });
    await persistir({
      meuCodigo: get().meuCodigo,
      meuLink: get().meuLink,
      convidadoPor: get().convidadoPor,
      convidados: convidadosActualizados,
    });

    return { comissao };
  },

  confirmarPagamento: async (convidadoId) => {
    const convidado = get().convidados.find(c => c.id === convidadoId);
    if (!convidado || convidado.estado !== 'pagou_pendente') return null;

    const convidadosActualizados = get().convidados.map(c =>
      c.id === convidadoId
        ? {
            ...c,
            estado: 'pagou_confirmado' as EstadoConvidado,
            ultimaActividade: new Date().toISOString(),
          }
        : c
    );

    set({ convidados: convidadosActualizados });
    await persistir({
      meuCodigo: get().meuCodigo,
      meuLink: get().meuLink,
      convidadoPor: get().convidadoPor,
      convidados: convidadosActualizados,
    });

    return { comissao: convidado.comissaoGerada };
  },

  reverterPagamento: async (convidadoId) => {
    const convidadosActualizados = get().convidados.map(c =>
      c.id === convidadoId
        ? {
            ...c,
            estado: 'reversed' as EstadoConvidado,
            comissaoGerada: 0,
            ultimaActividade: new Date().toISOString(),
          }
        : c
    );

    set({ convidados: convidadosActualizados });
    await persistir({
      meuCodigo: get().meuCodigo,
      meuLink: get().meuLink,
      convidadoPor: get().convidadoPor,
      convidados: convidadosActualizados,
    });
  },

  carregarReferencia: async () => {
    try {
      const guardado = await AsyncStorage.getItem(CHAVE_REFERENCIA);

      if (guardado) {
        const estado = JSON.parse(guardado);
        set({
          meuCodigo: estado.meuCodigo || '',
          meuLink: estado.meuLink || '',
          convidadoPor: estado.convidadoPor || null,
          convidados: estado.convidados || convidadosMock,
          carregado: true,
        });
      } else {
        set({ carregado: true });
      }
    } catch (e) {
      console.warn('Erro ao carregar referência:', e);
      set({ carregado: true });
    }
  },

  resetReferencia: async () => {
    set({
      meuCodigo: '',
      meuLink: '',
      convidadoPor: null,
      convidados: convidadosMock,
    });
    await AsyncStorage.removeItem(CHAVE_REFERENCIA);
  },

  // ============ GETTERS ============

  getTotalGanho: () => {
    return get().convidados
      .filter(c => c.estado === 'pagou_confirmado')
      .reduce((sum, c) => sum + c.comissaoGerada, 0);
  },

  getTotalPendente: () => {
    return get().convidados
      .filter(c => c.estado === 'pagou_pendente')
      .reduce((sum, c) => sum + c.comissaoGerada, 0);
  },

  getTotalConvidados: () => get().convidados.length,

  getConvidadosQuePagaram: () => {
    return get().convidados.filter(
      c => c.estado === 'pagou_pendente' || c.estado === 'pagou_confirmado'
    ).length;
  },

  getTaxaConversao: () => {
    const total = get().getTotalConvidados();
    if (total === 0) return 0;
    return Math.round((get().getConvidadosQuePagaram() / total) * 100);
  },
}));

// ============================================================
// HELPERS DE APRESENTAÇÃO
// ============================================================

export function labelEstadoConvidado(estado: EstadoConvidado): string {
  const labels: Record<EstadoConvidado, string> = {
    cadastrado: 'Cadastrado',
    pagou_pendente: 'Pagamento pendente',
    pagou_confirmado: 'Comissão recebida',
    reversed: 'Pagamento revertido',
  };
  return labels[estado];
}

export function corEstadoConvidado(estado: EstadoConvidado): 'cinza' | 'laranja' | 'verde' | 'vermelho' {
  const cores: Record<EstadoConvidado, 'cinza' | 'laranja' | 'verde' | 'vermelho'> = {
    cadastrado: 'cinza',
    pagou_pendente: 'laranja',
    pagou_confirmado: 'verde',
    reversed: 'vermelho',
  };
  return cores[estado];
}

export function tempoRelativo(dataISO: string): string {
  const agora = new Date();
  const data = new Date(dataISO);
  const diffMs = agora.getTime() - data.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) return 'agora';
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias === 1) return 'ontem';
  if (diffDias < 7) return `há ${diffDias} dias`;
  if (diffDias < 30) return `há ${Math.floor(diffDias / 7)} semanas`;
  return `há ${Math.floor(diffDias / 30)} meses`;
}