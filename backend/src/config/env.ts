/** Lê a configuração sensível num só sítio. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET em falta ou com menos de 32 caracteres. Gera um com: openssl rand -hex 32');
  }
  return secret;
}

/** Origens de browser autorizadas (ex.: painel de admin web). As apps móveis não precisam de CORS. */
export function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/** Swagger só liga fora de produção, salvo SWAGGER_ENABLED=true|false. */
export function isSwaggerEnabled(): boolean {
  const flag = process.env.SWAGGER_ENABLED;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/** Pasta onde ficam as fotografias de perfil (servidas em /uploads). */
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? 'uploads';

/** Nº mínimo de avaliações para mostrar médias/distribuição (protege o anonimato em amostras pequenas). */
export function getMinSample(): number {
  const n = Number(process.env.MIN_SAMPLE ?? 5);
  return Number.isInteger(n) && n >= 1 ? n : 5;
}
