/**
 * Motor offline: acompanha a ligação (NetInfo) e arranca a sincronização quando volta a haver rede,
 * quando a app volta ao primeiro plano, ao iniciar sessão e logo após guardar algo na fila.
 */
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { definirUtilizadorOffline } from './contexto';
import { obterDb } from './db';
import { useOfflineStore } from './estado';
import { sincronizar } from './sync';

const estaOnline = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) =>
  s.isConnected !== false && s.isInternetReachable !== false;

/** Chamado depois de guardar na fila: tenta enviar já, se houver rede. */
export const sincronizarSeOnline = () => { if (useOfflineStore.getState().online) void sincronizar(); };

export function iniciarMotor(userId: string): () => void {
  definirUtilizadorOffline(userId);
  void obterDb().catch(() => {});
  const aoMudarRede = NetInfo.addEventListener(s => {
    const online = estaOnline(s);
    const antes = useOfflineStore.getState().online;
    useOfflineStore.setState({ online });
    if (online && !antes) void sincronizar();
  });
  NetInfo.fetch().then(s => {
    useOfflineStore.setState({ online: estaOnline(s) });
    if (estaOnline(s)) void sincronizar();
  }).catch(() => {});
  const aoEstado = AppState.addEventListener('change', e => { if (e === 'active') sincronizarSeOnline(); });
  return () => {
    aoMudarRede();
    aoEstado.remove();
    definirUtilizadorOffline(null);
  };
}
