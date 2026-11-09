/**
 * Configuração da camada de serviços.
 *
 * Enquanto o backend não existir, deixe `EXPO_PUBLIC_API_URL` vazio:
 * todos os serviços usam dados locais (mock + AsyncStorage) e a app
 * funciona exactamente como hoje.
 *
 * Quando a API estiver pronta, defina em `.env`:
 *   EXPO_PUBLIC_API_URL=http://192.168.0.10:8081
 * Se a API falhar (offline, 500, timeout, resposta inválida), cada serviço
 * volta automaticamente ao fallback local — o ecrã nunca fica em branco.
 */
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

/** `true` só quando existe uma URL de API configurada. */
export const API_ATIVA: boolean = API_URL.length > 0;

/** Timeout dos pedidos à API (ms). Curto, para o fallback entrar depressa. */
export const API_TIMEOUT_MS = 8000;

/** Latência simulada do modo local (ms) — dá o "feeling" de rede nos loaders. Use 0 para desligar. */
export const LATENCIA_LOCAL_MS = 250;
