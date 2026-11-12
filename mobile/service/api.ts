import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_TIMEOUT_MS, API_URL } from './config';

export const CHAVE_TOKEN = 'avaliaprof_token';

export const api = axios.create({ baseURL: API_URL || undefined, timeout: API_TIMEOUT_MS });

let aoSessaoExpirada: (() => void) | null = null;
/** A store de sessão regista aqui o que fazer quando o servidor recusa o token (401). */
export const definirAoSessaoExpirada = (fn: () => void) => { aoSessaoExpirada = fn; };

api.interceptors.request.use(async config => {
  try {
    const token = await SecureStore.getItemAsync(CHAVE_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // SecureStore indisponível: segue sem token e o servidor responde 401.
  }
  return config;
});

export const CHAVE_REFRESH = 'avaliaprof_refresh';

/** Guarda o par de tokens devolvido pelo servidor (login, registo, activação ou renovação). */
export async function guardarTokens(token: string, refreshToken?: string) {
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
  if (refreshToken) await SecureStore.setItemAsync(CHAVE_REFRESH, refreshToken);
}

let renovacao: Promise<string | null> | null = null;

/**
 * Renova a sessão com o token de renovação. Só uma renovação de cada vez: pedidos em paralelo esperam pela mesma
 * (o servidor trata a reutilização de um token como roubo). Devolve o novo token de acesso, `null` se o servidor
 * recusou a sessão, e lança se falhou a rede (nesse caso a sessão mantém-se).
 */
function renovar(): Promise<string | null> {
  renovacao ??= (async () => {
    try {
      const refresh = await SecureStore.getItemAsync(CHAVE_REFRESH);
      if (!refresh) return null;
      // Instância sem interceptores, para não entrar em ciclo.
      const { data } = await axios.post<{ token: string; refreshToken: string }>(`${API_URL}/auth/refresh`, { refreshToken: refresh }, { timeout: API_TIMEOUT_MS });
      await guardarTokens(data.token, data.refreshToken);
      return data.token;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response && e.response.status >= 400 && e.response.status < 500) return null;
      throw e;
    } finally {
      setTimeout(() => { renovacao = null; }, 0);
    }
  })();
  return renovacao;
}

api.interceptors.response.use(
  r => r,
  async e => {
    const url: string = e.config?.url ?? '';
    // 401 em login/registo é "credenciais erradas", não sessão expirada.
    if (e.response?.status === 401 && !url.startsWith('/auth/')) {
      if (!e.config?._tentouRenovar) {
        try {
          const novo = await renovar();
          if (novo) {
            e.config._tentouRenovar = true;
            e.config.headers.Authorization = `Bearer ${novo}`;
            return api.request(e.config);
          }
        } catch {
          throw e; // sem rede: mantém a sessão e devolve o erro original
        }
      }
      aoSessaoExpirada?.();
    }
    throw e;
  },
);
