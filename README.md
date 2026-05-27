# Comunidad FASTA

Plataforma simple, visual y colaborativa para descubrir emprendimientos,
comercios, oficios y servicios de familias, docentes y miembros de la
comunidad FASTA — Colegio Boisdron, Tucumán.

> Comunidad FASTA es una iniciativa de familias. No es un sitio oficial de FASTA ni del Colegio Boisdron.

Lee `CLAUDE.md` para entender la filosofía, las reglas duras y el modelo de datos.
`STATUS.md` registra en qué fase está el proyecto y qué se decidió en cada una.

---

## Stack

- Next.js 16 (App Router · Server Components · Server Actions · Turbopack)
- TypeScript estricto
- Tailwind CSS v4
- PostgreSQL 16 + Drizzle ORM
- iron-session (admin y owner)
- Nodemailer (SMTP propio)
- sharp para imágenes locales
- Docker Compose para orquestar; Nginx en el host para SSL/proxy

Sin Vercel, Supabase, Auth0, Cloudinary, Resend, Google Analytics ni ningún BaaS.

---

## Local

```powershell
pnpm install
pnpm db:up           # levanta Postgres 16 (puerto 5434 del host)
pnpm db:migrate      # aplica migraciones
pnpm seed:dev        # categorías, familias semilla, emprendimientos demo, admin
pnpm dev             # http://localhost:3000
```

Login admin de dev: `admin@comunidad-fasta.local` / `admin1234`
(viene de `.env.local`; cambialo antes de prod).

Para ver mails en dev sin SMTP real:

```powershell
docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
# UI: http://localhost:8025
```

Y dejá `SMTP_HOST=localhost`, `SMTP_PORT=1025`. Si `SMTP_HOST` está vacío,
los mails se loguean por consola.

---

## Variables de entorno

Ver `.env.example`. Lo crítico para prod:

- `APP_URL` — URL pública (sin barra final).
- `DATABASE_URL` — conexión al Postgres.
- `SESSION_PASSWORD` — 32+ chars random.
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` — solo se usan en el seed.
- `SMTP_*` — para que salgan los mails.

---

## Deploy en VPS (Ubuntu 22.04+)

1. Instalar Docker + plugin compose + nginx + certbot:
   ```
   apt update && apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
   systemctl enable --now docker
   ```
2. Clonar:
   ```
   cd /var/www && git clone <repo> comunidad-fasta && cd comunidad-fasta
   ```
3. Crear `.env` (no `.env.local`):
   ```
   cp .env.example .env && nano .env
   ```
4. Levantar:
   ```
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   docker compose -f docker-compose.prod.yml run --rm app node_modules/.bin/drizzle-kit migrate
   ```
5. Seed inicial (solo la primera vez):
   ```
   docker compose -f docker-compose.prod.yml run --rm app node_modules/.bin/tsx src/db/seed.ts
   ```
6. Nginx:
   - Copiar `deploy/nginx.conf.example` a `/etc/nginx/sites-available/comunidad-fasta`, editar `server_name`.
   - `ln -s` a `sites-enabled`, `nginx -t`, `systemctl reload nginx`.
   - `certbot --nginx -d comunidad-fasta.tu-dominio`.
7. Crons:
   ```
   crontab -e
   # backup nocturno (3am):
   0 3 * * * /var/www/comunidad-fasta/deploy/backup-db.sh >> /var/log/comfasta-backup.log 2>&1
   # keepalive opcional:
   */15 * * * * curl -sS -o /dev/null http://127.0.0.1:3000/
   ```
8. Para actualizar: `./deploy/deploy.sh`.

Backups en `/var/backups/comunidad-fasta/` con rotación de 14 días.

---

## Operación

- **Cambiar password admin:** entrar al server, conectarse a Postgres y hacer
  `UPDATE admin_users SET password_hash = '...' WHERE email = '...'`. No hay UI.
- **Aprobar a mano un emprendimiento expirado:** `/admin/emprendimientos`,
  cambiar status a `active`.
- **Cambiar mail propietario:** se hace desde el admin editando el `ownerEmail`.
  No hay self-service.
- **Borrar emprendimiento:** desde el admin. La foto en `storage/businesses/` queda
  como huérfana hasta limpieza manual.
- **Logs:** `/admin/logs` muestra eventos (creación, validaciones, status, login,
  edits, magic links emitidos).

---

## Módulo "Necesito algo"

Permite a un visitante escribir una necesidad en lenguaje natural y recibir
emprendimientos compatibles.

- Formulario público: `/necesito`.
- Resultados: `/necesito/resultados/{needId}` (cada búsqueda persiste un
  `community_needs` con su snapshot de resultados).
- Admin: `/admin/necesidades` (listado, filtros, contadores) y
  `/admin/necesidades/{id}` (detalle, cambio de estado, notas, ver match en
  vivo y el snapshot original).
- Motor: Postgres full-text (`websearch_to_tsquery('spanish', …)`) sobre
  nombre + descripción + nombre de categoría + etiquetas, combinado con
  overlap de `tags`, match por rubro/zona y un scoring TS explicable que
  emite razones breves por resultado.

### Agregar sinónimos / contextos

Editar `src/config/community-search.ts`. Cada entrada del array `SYNONYMS` es:

```ts
{
  triggers: ["palabra", "variante", "sinonimo"], // disparadores en la query
  expansions: ["torta", "candy bar", "fotografia"], // se suman al ts_query
  categorySlugs: ["eventos-y-catering"], // rubros que se boostean cuando matchea
}
```

Después del cambio, reiniciar el server (o redeploy). No requiere migración
ni reindex porque la búsqueda usa Postgres directo. Los pesos del scoring
están en el mismo archivo (`SEARCH_WEIGHTS`).

### Cómo "reindexar"

No hay índice externo en esta etapa. El índice GIN sobre
`to_tsvector('spanish', name||description)` se mantiene solo. Si en el futuro
se migra a Meilisearch/Typesense, el punto de extensión es
`src/services/needs/need-search.ts`: reemplazar la query SQL por una llamada
al motor externo y dejar intacto el scoring/explicación si se quiere
mantener la misma UX.

---

## Filosofía

- Cero tracking de terceros.
- Cero animaciones decorativas.
- Mobile-first siempre.
- Voseo siempre. Editorial, breve, sin emojis en el sitio.
- El sitio es público pero `noindex`. No queremos aparecer en Google.
