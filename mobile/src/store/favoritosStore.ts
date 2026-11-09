/**
 * Anúncios guardados ("Salvos"), partilhados por Explorar, Detalhe, Salvos e Perfil.
 * Persistidos em AsyncStorage.
 */
import { create } from 'zustand';
import { favoritosService } from '../../service/favoritosService';

interface FavoritosState {
  ids: string[];
  carregado: boolean;
  carregar: () => Promise<void>;
  alternar: (id: string) => void;
}

const guardar = (ids: string[]) => favoritosService.guardar(ids).catch(() => {});

export const useFavoritosStore = create<FavoritosState>((set, get) => ({
  ids: [],
  carregado: false,
  carregar: async () => {
    if (get().carregado) return;
    const ids = await favoritosService.listar();
    set({ ids, carregado: true });
  },
  alternar: id => {
    const ids = get().ids.includes(id) ? get().ids.filter(x => x !== id) : [id, ...get().ids];
    set({ ids });
    void guardar(ids);
  },
}));
