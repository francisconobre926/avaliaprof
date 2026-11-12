import { create } from 'zustand';

/** Estado observável do modo offline (rede, sincronização, fila e leitura de cache). */
interface EstadoOffline {
  online: boolean;
  aSincronizar: boolean;
  /** true quando a última leitura veio da cópia guardada por falta de ligação. */
  usandoCache: boolean;
  /** Incrementa sempre que a fila muda: ecrãs e hook recarregam. */
  versaoFila: number;
  /** Incrementa quando uma sincronização aplicou resultados: ecrãs recarregam dados do servidor. */
  versaoDados: number;
}

export const useOfflineStore = create<EstadoOffline>(() => ({
  online: true, aSincronizar: false, usandoCache: false, versaoFila: 0, versaoDados: 0,
}));

export const marcarFilaAlterada = () => useOfflineStore.setState(s => ({ versaoFila: s.versaoFila + 1 }));
