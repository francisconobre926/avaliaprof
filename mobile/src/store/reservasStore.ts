/**
 * src/store/reservasStore.ts
 * Reservas do procurador, persistidas em AsyncStorage (protótipo, sem backend).
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetodoPagamento, cancelamentoGratis } from '../utils/reservas';

const CHAVE = '@gohome_reservas_v1';

export type EstadoReserva = 'confirmada' | 'pendente' | 'cancelada' | 'concluida';

export interface Reserva {
  id: string;
  codigo: string; // ex.: RX-48213
  anuncioId: string;
  titulo: string;
  local: string;
  foto?: string;
  entrada: string; // ISO
  saida: string; // ISO
  hospedes: number;
  noites: number;
  subtotal: number;
  taxa: number;
  total: number;
  metodo: MetodoPagamento;
  telefone: string;
  estado: EstadoReserva;
  criadaEm: string;
}

interface ReservasState {
  reservas: Reserva[];
  carregado: boolean;
  carregar: () => Promise<void>;
  criar: (r: Omit<Reserva, 'id' | 'codigo' | 'estado' | 'criadaEm'>) => Promise<Reserva>;
  cancelar: (id: string) => Promise<{ reembolso: boolean }>;
}

const guardar = (reservas: Reserva[]) =>
  AsyncStorage.setItem(CHAVE, JSON.stringify(reservas)).catch(() => {});

export const useReservasStore = create<ReservasState>((set, get) => ({
  reservas: [],
  carregado: false,

  carregar: async () => {
    try {
      const raw = await AsyncStorage.getItem(CHAVE);
      set({ reservas: raw ? JSON.parse(raw) : [], carregado: true });
    } catch {
      set({ carregado: true });
    }
  },

  criar: async (dados) => {
    const reserva: Reserva = {
      ...dados,
      id: `r${Date.now()}`,
      codigo: `RX-${Math.floor(10000 + Math.random() * 89999)}`,
      estado: 'confirmada',
      criadaEm: new Date().toISOString(),
    };
    const reservas = [reserva, ...get().reservas];
    set({ reservas });
    await guardar(reservas);
    return reserva;
  },

  cancelar: async (id) => {
    const alvo = get().reservas.find(r => r.id === id);
    const reembolso = !!alvo && cancelamentoGratis(alvo.entrada);
    const reservas = get().reservas.map(r => (r.id === id ? { ...r, estado: 'cancelada' as const } : r));
    set({ reservas });
    await guardar(reservas);
    return { reembolso };
  },
}));
