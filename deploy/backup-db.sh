#!/usr/bin/env bash
# Backup nocturno de Postgres. Crontab sugerido:
#   0 3 * * * /var/www/comunidad-fasta/deploy/backup-db.sh >> /var/log/comfasta-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/var/backups/comunidad-fasta"
KEEP_DAYS=14
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/comfasta-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec comfasta-db pg_dump -U "${POSTGRES_USER:-comfasta}" -d "${POSTGRES_DB:-comfasta}" \
  | gzip > "$OUT"

# rotación
find "$BACKUP_DIR" -type f -name 'comfasta-*.sql.gz' -mtime +${KEEP_DAYS} -delete

echo "[$(date -Iseconds)] backup ok: $OUT"
