/**
 * src/store/reservasStore.ts
 * Reservas do procurador, persistidas em AsyncStorage (protótipo, sem backend).
 */
import { create } from 'zustand';
import { MetodoPagamento } from '../utils/reservas';
import { reservasService } from '../../service/reservasService';

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

export const useReservasStore = create<ReservasState>((set, get) => ({
  reservas: [],
  carregado: false,

  carregar: async () => {
    const reservas = await reservasService.listar();
    set({ reservas, carregado: true });
  },

  criar: async (dados) => {
    const reserva = await reservasService.criar(dados);
    set({ reservas: [reserva, ...get().reservas] });
    return reserva;
  },

  cancelar: async (id) => {
    const resultado = await reservasService.cancelar(id);
    set({ reservas: get().reservas.map(r => (r.id === id ? { ...r, estado: 'cancelada' as const } : r)) });
    return resultado;
  },
}));
