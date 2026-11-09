/**
 * Utilitários partilhados pelos serviços: "API primeiro, fallback local sempre".
 */
import { api } from './api';
import { API_ATIVA, LATENCIA_LOCAL_MS } from './config';

const esperar = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export interface Resultado<T> {
  dados: T;
  /** De onde vieram os dados — útil para debug ou para mostrar um aviso "offline". */
  origem: 'api' | 'local';
}

/**
 * Leitura: tenta a API (se activa) e, em qualquer falha ou resposta inválida,
 * devolve o fallback local. Nunca lança erro.
 */
export async function lerComFallback<T>(opcoes: {
  remoto: () => Promise<T>;
  local: () => Promise<T> | T;
  /** Valida a resposta da API; se devolver false usa o fallback. */
  valido?: (dados: T) => boolean;
  /** Chamado com os dados da API (ex.: para espelhar em cache local). */
  aoSucesso?: (dados: T) => void | Promise<void>;
  nome?: string;
}): Promise<Resultado<T>> {
  if (API_ATIVA) {
    try {
      const dados = await opcoes.remoto();
      if (!opcoes.valido || opcoes.valido(dados)) {
        try { await opcoes.aoSucesso?.(dados); } catch { /* cache é opcional */ }
        return { dados, origem: 'api' };
      }
      if (__DEV__) console.warn(`[service:${opcoes.nome ?? '?'}] resposta inválida — fallback local`);
    } catch (erro) {
      if (__DEV__) console.warn(`[service:${opcoes.nome ?? '?'}] API falhou — fallback local`, (erro as Error)?.message);
    }
  } else if (LATENCIA_LOCAL_MS > 0) {
    await esperar(LATENCIA_LOCAL_MS);
  }
  return { dados: await opcoes.local(), origem: 'local' };
}

/**
 * Escrita "local primeiro": grava sempre localmente (a app nunca perde dados)
 * e tenta sincronizar com a API em segundo plano. Falhas da API são engolidas.
 * Devolve o resultado local.
 */
export async function escreverComFallback<T>(opcoes: {
  local: () => Promise<T> | T;
  remoto?: (resultadoLocal: T) => Promise<unknown>;
  nome?: string;
}): Promise<T> {
  const resultado = await opcoes.local();
  if (API_ATIVA && opcoes.remoto) {
    opcoes.remoto(resultado).catch(erro => {
      if (__DEV__) console.warn(`[service:${opcoes.nome ?? '?'}] sync falhou (ficou só local)`, (erro as Error)?.message);
    });
  }
  return resultado;
}

/** Extrai uma lista de respostas comuns: `[...]`, `{ data: [...] }`, `{ items: [...] }`, `{ results: [...] }`. */
export function extrairLista<T>(corpo: any): T[] {
  if (Array.isArray(corpo)) return corpo;
  for (const k of ['data', 'items', 'results', 'anuncios', 'reservas']) {
    if (Array.isArray(corpo?.[k])) return corpo[k];
  }
  return [];
}

export { api };
