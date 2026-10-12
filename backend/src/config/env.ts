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

/**
 * Segredo que decide o deslocamento da localização aproximada dos anúncios.
 * Se mudar, todas as posições aproximadas passam a outro sítio (sem prejuízo para
 * os dados, mas visível), por isso guarda-o junto com os outros segredos.
 */
export function getLocationSecret(): string {
  const secret = process.env.LOCATION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'LOCATION_SECRET em falta ou com menos de 32 caracteres. Gera um com: openssl rand -hex 32',
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

/**
 * A documentação Swagger lista todas as rotas da API, por isso só fica ligada fora de
 * produção. Para a ligar (ou desligar) à força, define SWAGGER_ENABLED=true ou false.
 */
export function isSwaggerEnabled(): boolean {
  const flag = process.env.SWAGGER_ENABLED;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}