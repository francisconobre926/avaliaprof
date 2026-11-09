/**
 * Reservas do procurador.
 *
 * API esperada:
 *   GET    /reservas            → Reserva[]
 *   POST   /reservas            → Reserva criada
 *   POST   /reservas/:id/cancelar
 *
 * Fallback local: AsyncStorage (@gohome_reservas_v1).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reserva } from '../src/store/reservasStore';
import { cancelamentoGratis } from '../src/utils/reservas';
import { api, escreverComFallback, extrairLista, lerComFallback } from './fallback';

const CHAVE = '@gohome_reservas_v1';

export type NovaReserva = Omit<Reserva, 'id' | 'codigo' | 'estado' | 'criadaEm'>;

async function lerLocal(): Promise<Reserva[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}
const gravarLocal = (r: Reserva[]) => AsyncStorage.setItem(CHAVE, JSON.stringify(r)).catch(() => {});
const eReserva = (r: any): r is Reserva => !!r && typeof r === 'object' && r.id != null && r.anuncioId != null;

export const reservasService = {
  async listar(): Promise<Reserva[]> {
    const { dados } = await lerComFallback<Reserva[]>({
      nome: 'reservas.listar',
      remoto: async () => extrairLista<Reserva>((await api.get('/reservas')).data).filter(eReserva),
      valido: Array.isArray,
      aoSucesso: gravarLocal,
      local: lerLocal,
    });
    return dados;
  },

  async criar(dados: NovaReserva): Promise<Reserva> {
    const reserva: Reserva = {
      ...dados,
      id: `r${Date.now()}`,
      codigo: `RX-${Math.floor(10000 + Math.random() * 89999)}`,
      estado: 'confirmada',
      criadaEm: new Date().toISOString(),
    };
    return escreverComFallback<Reserva>({
      nome: 'reservas.criar',
      local: async () => { await gravarLocal([reserva, ...(await lerLocal())]); return reserva; },
      remoto: () => api.post('/reservas', reserva),
    });
  },

  async cancelar(id: string): Promise<{ reembolso: boolean }> {
    const todas = await lerLocal();
    const alvo = todas.find(r => r.id === id);
    const reembolso = !!alvo && cancelamentoGratis(alvo.entrada);
    return escreverComFallback<{ reembolso: boolean }>({
      nome: 'reservas.cancelar',
      local: async () => {
        await gravarLocal(todas.map(r => (r.id === id ? { ...r, estado: 'cancelada' as const } : r)));
        return { reembolso };
      },
      remoto: () => api.post(`/reservas/${encodeURIComponent(id)}/cancelar`),
    });
  },
};
