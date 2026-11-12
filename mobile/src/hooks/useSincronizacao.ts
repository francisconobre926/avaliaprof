import { useCallback, useEffect, useState } from 'react';
import { utilizadorOffline } from '../offline/contexto';
import { useOfflineStore } from '../offline/estado';
import { outbox, type ItemFila } from '../offline/outbox';
import { sincronizar } from '../offline/sync';

/** Estado do modo offline para os ecrãs: rede, fila, e acções de descartar / tentar de novo. */
export function useSincronizacao() {
  const online = useOfflineStore(s => s.online);
  const aSincronizar = useOfflineStore(s => s.aSincronizar);
  const usandoCache = useOfflineStore(s => s.usandoCache);
  const versaoFila = useOfflineStore(s => s.versaoFila);
  const versaoDados = useOfflineStore(s => s.versaoDados);
  const [fila, setFila] = useState<ItemFila[]>([]);

  useEffect(() => {
    const id = utilizadorOffline();
    if (!id) { setFila([]); return; }
    let vivo = true;
    outbox.listar(id).then(l => { if (vivo) setFila(l); }).catch(() => {});
    return () => { vivo = false; };
  }, [versaoFila]);

  const descartar = useCallback((id: number) => outbox.remover(id), []);
  const tentarDeNovo = useCallback(async (id: number) => { await outbox.repor(id); void sincronizar(); }, []);

  return {
    online, aSincronizar, usandoCache, fila, versaoDados,
    pendentes: fila.filter(i => i.status === 'PENDING'),
    problemas: fila.filter(i => i.status !== 'PENDING'),
    descartar, tentarDeNovo,
    sincronizar: () => { void sincronizar(); },
  };
}
