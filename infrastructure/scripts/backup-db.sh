#!/usr/bin/env bash
# Backup da base de dados do GoHome (pg_dump em formato custom, comprimido).
set -euo pipefail
umask 077

source "$(dirname "${BASH_SOURCE[0]}")/_db-env.sh"

BACKUP_DIR="${BACKUP_DIR:-$HOME/gohome-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
MIN_BACKUPS_KEPT=3

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
final="$BACKUP_DIR/gohome-$stamp.dump"
tmp="$final.partial"
trap 'rm -f "$tmp"' EXIT

pg_dump --format=custom --no-owner --no-privileges --file="$tmp"

# Um ficheiro que o pg_restore não consegue ler não serve de backup
pg_restore --list "$tmp" > /dev/null
mv "$tmp" "$final"
echo "Backup criado: $final ($(du -h "$final" | cut -f1))"

# Retenção: apaga os antigos, mas nunca deixa menos de MIN_BACKUPS_KEPT
mapfile -t all < <(ls -1t "$BACKUP_DIR"/gohome-*.dump)
if (( ${#all[@]} > MIN_BACKUPS_KEPT )); then
  for f in "${all[@]:MIN_BACKUPS_KEPT}"; do
    if [[ -n "$(find "$f" -mtime +"$RETENTION_DAYS" -print)" ]]; then
      rm -f -- "$f"
      echo "Removido por antiguidade: $f"
    fi
  done
fi