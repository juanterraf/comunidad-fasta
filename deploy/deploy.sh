#!/usr/bin/env bash
# Despliegue idempotente.
# Uso: ./deploy/deploy.sh
# Lo corre el usuario que tiene la cuenta en /var/www/comunidad-fasta.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ git pull"
git pull --ff-only

echo "→ docker compose build & up"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "→ esperando salud de la DB…"
for i in {1..30}; do
  if docker exec comfasta-db pg_isready -U "${POSTGRES_USER:-comfasta}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "→ aplicando migraciones"
docker compose -f docker-compose.prod.yml run --rm app node_modules/.bin/drizzle-kit migrate

echo "→ recargando nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✓ deploy completo"
