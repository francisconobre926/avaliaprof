#!/usr/bin/env bash
# Lê o DATABASE_URL e prepara as variáveis PG*. Usado por source nos outros scripts.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../../backend/.env}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "Não encontrei $ENV_FILE nem a variável DATABASE_URL." >&2; exit 1; }
  DATABASE_URL="$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d "\"'")"
fi

# O ?schema=public do Prisma não é válido para o libpq, por isso cortamos a query
url="${DATABASE_URL%%\?*}"

re='^postgres(ql)?://([^:@/]+):([^@/]*)@([^:/@]+)(:([0-9]+))?/([^/?]+)$'
if [[ ! "$url" =~ $re ]]; then
  echo "DATABASE_URL com formato inesperado. Esperado: postgresql://utilizador:password@host:porta/base" >&2
  echo "Se a password tiver caracteres especiais, escreve-os em percent-encoding (ex: @ passa a %40)." >&2
  exit 1
fi

export PGUSER="${BASH_REMATCH[2]}"
encoded="${BASH_REMATCH[3]}"
export PGPASSWORD="$(printf '%b' "${encoded//%/\\x}")"
export PGHOST="${BASH_REMATCH[4]}"
export PGPORT="${BASH_REMATCH[6]:-5432}"
export PGDATABASE="${BASH_REMATCH[7]}"
unset DATABASE_URL url re encoded