/**
 * Cache "stale-while-revalidate" das leituras do estudante.
 * Online: vai sempre ao servidor e guarda a resposta. Sem ligação (erro SEM_REDE): devolve a última
 * cópia guardada deste utilizador e sinaliza `usandoCache` para a interface avisar. Erros do
 * servidor (403, 404, ...) nunca são escondidos pela cache.
 */
import { ErroServico } from '../../service/erro';
import { utilizadorOffline } from './contexto';
import { obterDb } from './db';
import { useOfflineStore } from './estado';

export async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const userId = utilizadorOffline();
  try {
    const dados = await buscar();
    if (userId) {
      obterDb()
        .then(db => db.runAsync('INSERT OR REPLACE INTO cache (key, userId, value, updatedAt) VALUES (?, ?, ?, ?)', `${userId}:${chave}`, userId, JSON.stringify(dados), Date.now()))
        .catch(() => {});
    }
    if (useOfflineStore.getState().usandoCache) useOfflineStore.setState({ usandoCache: false });
    return dados;
  } catch (e) {
    if (e instanceof ErroServico && e.codigo === 'SEM_REDE' && userId) {
      try {
        const db = await obterDb();
        const l = await db.getFirstAsync<{ value: string }>('SELECT value FROM cache WHERE key = ? AND userId = ?', `${userId}:${chave}`, userId);
        if (l) {
          useOfflineStore.setState({ usandoCache: true });
          return JSON.parse(l.value) as T;
        }
      } catch { /* sem cache utilizável: propaga o erro de rede */ }
    }
    throw e;
  }
}

/** Dados pessoais em cache apagam-se ao terminar a sessão. (A fila fica, filtrada por utilizador, para não perder avaliações por enviar.) */
export async function limparCache(): Promise<void> {
  try { (await obterDb()).runAsync('DELETE FROM cache'); } catch { /* ignora */ }
  useOfflineStore.setState({ usandoCache: false });
}
