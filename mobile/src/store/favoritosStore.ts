/**
 * Anúncios guardados ("Salvos"), partilhados por Explorar, Detalhe, Salvos e Perfil.
 * Persistidos em AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@gohome_favoritos_v1';

interface FavoritosState {
  ids: string[];
  carregado: boolean;
  carregar: () => Promise<void>;
  alternar: (id: string) => void;
}

const guardar = (ids: string[]) => AsyncStorage.setItem(CHAVE, JSON.stringify(ids)).catch(() => {});

export const useFavoritosStore = create<FavoritosState>((set, get) => ({
  ids: [],
  carregado: false,
  carregar: async () => {
    if (get().carregado) return;
    try {
      const raw = await AsyncStorage.getItem(CHAVE);
      const lista = raw ? JSON.parse(raw) : [];
      set({ ids: Array.isArray(lista) ? lista.map(String) : [], carregado: true });
    } catch {
      set({ ids: [], carregado: true });
    }
  },
  alternar: id => {
    const ids = get().ids.includes(id) ? get().ids.filter(x => x !== id) : [id, ...get().ids];
    set({ ids });
    void guardar(ids);
  },
}));
