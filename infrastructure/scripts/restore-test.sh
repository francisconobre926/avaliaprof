#!/usr/bin/env bash
# Prova que o backup mais recente restaura de verdade, numa base temporária.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_db-env.sh"

BACKUP_DIR="${BACKUP_DIR:-$HOME/gohome-backups}"
TEST_DB="gohome_restore_test"
SOURCE_DB="$PGDATABASE"

file="${1:-$(ls -1t "$BACKUP_DIR"/gohome-*.dump 2>/dev/null | head -1)}"
[[ -n "$file" && -f "$file" ]] || { echo "Nenhum backup encontrado em $BACKUP_DIR." >&2; exit 1; }

# Salvaguarda: nunca mexer na base verdadeira
[[ "$TEST_DB" != "$SOURCE_DB" ]] || { echo "Recusado: a base de teste é igual à real." >&2; exit 1; }

cleanup() { psql -d postgres -qc "DROP DATABASE IF EXISTS $TEST_DB" > /dev/null 2>&1 || true; }
trap cleanup EXIT

echo "A restaurar $file para $TEST_DB..."
psql -d postgres -qc "DROP DATABASE IF EXISTS $TEST_DB"
psql -d postgres -qc "CREATE DATABASE $TEST_DB"
pg_restore --dbname="$TEST_DB" --no-owner --no-privileges --exit-on-error "$file"

read -r -d '' COUNTS <<'SQL' || true
SELECT 'users', count(*) FROM "users"
UNION ALL SELECT 'listings', count(*) FROM "listings"
UNION ALL SELECT 'unlocks', count(*) FROM "unlocks"
UNION ALL SELECT 'publications', count(*) FROM "ListingPublication"
UNION ALL SELECT 'reports', count(*) FROM "reports";
SQL

echo
echo "Contagens (tabela, base real, tabela, base restaurada):"
paste -d' ' \
  <(psql -d "$SOURCE_DB" -tA -F' ' -c "$COUNTS") \
  <(psql -d "$TEST_DB" -tA -F' ' -c "$COUNTS")
echo
echo "Restauro OK. Pequenas diferenças são normais se houve actividade depois do backup."