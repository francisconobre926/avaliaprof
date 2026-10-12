/**
 * Lê a configuração sensível num só sítio, para todos os módulos usarem o mesmo valor.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET em falta ou com menos de 32 caracteres. Gera um com: openssl rand -base64 48',
    );
  }
  return secret;
}

/** Origens de browser autorizadas (ex.: o painel de admin). As apps móveis não precisam de CORS. */
export function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}