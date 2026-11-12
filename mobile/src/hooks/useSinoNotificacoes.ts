import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNotificacoesStore } from '../store/notificacoesStore';

const CADA_MS = 60_000;

/** Mantém o contador do sino actualizado enquanto há sessão: ao abrir, de minuto a minuto e ao voltar à app. */
export function useSinoNotificacoes(activo: boolean) {
  useEffect(() => {
    if (!activo) { useNotificacoesStore.getState().definir(0); return; }
    const actualizar = () => { void useNotificacoesStore.getState().actualizar(); };
    actualizar();
    const t = setInterval(actualizar, CADA_MS);
    const s = AppState.addEventListener('change', e => { if (e === 'active') actualizar(); });
    return () => { clearInterval(t); s.remove(); };
  }, [activo]);
}
