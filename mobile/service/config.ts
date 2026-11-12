/**
 * Configuração da camada de serviços.
 *
 * `EXPO_PUBLIC_API_URL` aponta para a API (ver `.env.example`). Num telemóvel físico
 * tem de ser o IP da máquina na rede local, não `localhost`.
 */
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

/** Timeout dos pedidos à API (ms). 20 s: um servidor gratuito (Render) demora a acordar no primeiro pedido. */
export const API_TIMEOUT_MS = 20000;
