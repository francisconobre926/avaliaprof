/**
 * Recurso persistido: um blob JSON guardado em AsyncStorage (cache/fallback)
 * e sincronizado com um endpoint REST quando a API está activa.
 *
 *   GET  {endpoint}  → devolve o estado do servidor
 *   PUT  {endpoint}  → grava o estado completo
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, escreverComFallback, lerComFallback } from './fallback';

export function criarRecurso<T>(opcoes: { chave: string; endpoint: string; nome: string }) {
  const { chave, endpoint, nome } = opcoes;

  const lerLocal = async (): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(chave);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  return {
    /** Servidor primeiro; se falhar devolve a cache local (ou null). */
    carregar: async (): Promise<T | null> => {
      const { dados } = await lerComFallback<T | null>({
        nome,
        remoto: async () => (await api.get<T>(endpoint)).data,
        valido: d => d != null,
        aoSucesso: d => AsyncStorage.setItem(chave, JSON.stringify(d)),
        local: lerLocal,
      });
      return dados;
    },
    guardar: (estado: T): Promise<void> =>
      escreverComFallback<void>({
        nome,
        local: () => AsyncStorage.setItem(chave, JSON.stringify(estado)),
        remoto: () => api.put(endpoint, estado),
      }),
    limpar: (): Promise<void> =>
      escreverComFallback<void>({
        nome,
        local: () => AsyncStorage.removeItem(chave),
        remoto: () => api.delete(endpoint),
      }),
    lerLocal,
  };
}
