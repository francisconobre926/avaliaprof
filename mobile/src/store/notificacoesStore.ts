import { create } from 'zustand';
import { notificacoesService } from '../../service/notificacoesService';

interface NotificacoesState {
  porLer: number;
  definir: (n: number) => void;
  actualizar: () => Promise<void>;
}

/** Contador de notificações por ler (o sino). Falhas de rede mantêm o último valor. */
export const useNotificacoesStore = create<NotificacoesState>(set => ({
  porLer: 0,
  definir: porLer => set({ porLer }),
  actualizar: async () => {
    try { set({ porLer: await notificacoesService.porLer() }); } catch { /* sem rede: mantém */ }
  },
}));
