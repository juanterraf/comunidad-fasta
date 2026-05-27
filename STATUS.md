# STATUS — Comunidad FASTA

Última actualización: 2026-05-27

## Fase actual
**Todas las fases del CLAUDE.md más extensiones (reacciones, geolocalización,
campañas, historias destacadas, "Necesito algo") están implementadas.** El
proyecto está listo para deploy, polish con fotos reales del cliente, y
Lighthouse productivo.

---

## Módulo "Necesito algo" — 2026-05-27

Búsqueda en lenguaje natural + persistencia de la consulta + admin básico.

### Stack de la búsqueda
- **Motor:** Postgres `websearch_to_tsquery('spanish', …)` sobre
  `name || description || category.name || tags`, combinado con overlap de
  `tags` (`b.tags && tokens[]`), match exacto de rubro y `ILIKE` sobre
  barrio. Reaprovecha el índice GIN ya creado en `0000_init` y suma la
  categoría al texto buscado en runtime.
- **Expansión semántica artesanal** en `src/config/community-search.ts`:
  ~30 entradas con `triggers`/`expansions`/`categorySlugs`. Sin LLM, sin
  servicios externos. Aplicada en `src/services/needs/query-expansion.ts`
  (normaliza, tokeniza, descarta stopwords ES, matchea triggers
  uni/multi-palabra).
- **Scoring** en TS (`src/services/needs/need-search.ts`): `ts_rank` + overlap
  de tags + categoría matcheada + zona matcheada + featured + recencia.
  Cada peso en `SEARCH_WEIGHTS`. Devuelve top 20 con razones breves
  generadas por `match-explanation.ts`.
- **Meilisearch / Typesense: no instalado** en esta etapa. Razón: el motor
  Postgres + expansión semántica resuelve los casos de prueba sin sumar
  un servicio. La interfaz `searchByNeed(...)` queda encapsulada para
  que migrar a un motor externo sea reemplazar esa función sin tocar
  controllers, scoring de razones ni UI. Documentado en README.

### Datos
- Tabla `community_needs` (id, query_original, query_expanded, name, email,
  whatsapp, zone, category_hint_id, urgency, budget, consent, status,
  admin_notes, matched_results jsonb, ip_address, user_agent, timestamps).
- Tabla `need_search_logs` (id, need_id, query, results_count,
  clicked_business_id, created_at) — reservada para métricas y clicks
  futuros; el submit ya crea una entrada inicial.
- Schema en `src/db/schema.ts`. **Para generar la migración:**
  `pnpm db:generate` la produce a partir del schema (no la pre-escribí a
  mano para evitar inconsistencia con el snapshot). Después `pnpm db:migrate`.

### Páginas y rutas
- Pública `/necesito` — formulario con voseo, copy editorial, contacto
  colapsable + consentimiento obligatorio si se dejan datos personales.
- Pública `/necesito/resultados/[id]` — resultados ordenados con razones
  por resultado, CTA WhatsApp/IG/ver más, fallback amable si no hay.
- Admin `/admin/necesidades` — listado paginado con búsqueda y filtros por
  status, contadores (total, nuevas, resueltas, destacadas, sin
  resultados).
- Admin `/admin/necesidades/[id]` — detalle con cambio de estado, notas,
  resultados live (rerun en el momento) y snapshot del momento de la
  consulta.

### Privacidad
- Si el usuario NO marca consent y dejó datos de contacto, el submit
  falla con un mensaje claro.
- Si marca consent y deja datos, se guardan. Sin consent, solo queda la
  query + zona + IP/UA (para detección de spam) + resultados snapshot.
- El admin solo ve los datos personales si hay consent (UI lo distingue
  visualmente).
- Nada se publica fuera del admin.

### Integración
- Header y footer suman link a "Necesito algo".
- Landing tiene un strip editorial con la frase guía interna
  ("antes de buscarlo afuera, fijate si lo hace alguien de la comunidad")
  como CTA discreto.
- Admin sidebar suma "Necesidades".
- Dashboard admin suma una tarjeta "Necesidades nuevas" + indicador de
  "sin resultados".
- Eventos loguean: `need.created`, `need.status.<x>`, `need.notes_updated`.

### Pendientes recomendados (siguiente etapa)
1. Registrar clicks reales con `logResultClick` (hook desde la card).
2. Vista agregada en admin: rubros/palabras más buscadas (basado en
   `need_search_logs` y `query_expanded`).
3. Notificación al admin por mail cuando llega una necesidad urgente o
   sin resultados.
4. Migración opcional a Meilisearch cuando el volumen lo justifique
   (reemplazo aislado en `searchByNeed`).

---

## Refresh visual "agencia editorial" — 2026-05-27

Aplicadas las **Fases 1 + 2** del plan ui-ux-pro-max.

### Fase 1 — Tokens y estilos base
- Paleta nueva en `globals.css`: bg `#F7F2EA`, ink `#11100D`, acento
  terracota `#C84D2F`, secundario azul `#17324D`, bordes `#DED6C8`,
  muted `#625A50`. Más contraste, blancos puros disponibles.
- Tipografía display sube a 700 con letter-spacing `-0.03em` para
  titulares. Nueva clase `.display-xl` (700, `-0.045em`, line-height 0.92)
  para el hero monumental.
- Utilities editoriales nuevas: `.editorial-rule` (dateline con línea fina
  al inicio), `.metric` (dato editorial con número en display + label
  pequeño), `.clamp-5`.
- Radios reducidos para tono más editorial (lg pasó de 16 a 14, md de 10
  a 8). Mantengo `radius-full` para chips de filtros.
- `Tag` suma variante `editorial` (texto pequeño en mayúsculas con
  tracking ancho, sin fondo) — usable como categoría debajo del nombre
  en cards.

### Fase 2 — Home rediseñada
- **Hero editorial** sin foto (decisión confirmada con cliente porque
  todavía no llegaron las imágenes reales):
  - dateline "Comunidad FASTA · Colegio Boisdron · Tucumán · {año}";
  - titular monumental 128px en lg con acento solo en la última línea
    ("emprende.");
  - subtítulo breve, dos líneas máx;
  - CTAs: primario sólido + secundario subrayado;
  - **stats integrados como dato editorial** ("24 emprendimientos
    activos · 14 familias validadas · 12 rubros") con separadores
    verticales finos;
  - **pieza visual placeholder** `<HeroVisualPlaceholder />` (grilla 3x3
    con copy editorial al pie y un monograma "f" — está pensada para
    reemplazarse por una foto/collage real sin tocar el layout).
- **Destacados de la comunidad** (1 grande + 2 secundarias) con layout
  asimétrico 7+5 columnas en lg. Card grande usa variante `featured`
  con aspect 5/6 + badge "Destacado". Las dos secundarias usan
  variante `editorial` con aspect 4/5.
- **Strip "Necesito algo"** rediseñado: bloque editorial sobre
  `--color-surface-warm`, tipografía display 5xl, copy con la frase
  guía interna ("antes de buscarlo afuera, fijate si lo hace alguien
  de la comunidad"), CTA subrayado.
- **Categorías como tabla editorial**: grid 4 columnas en lg con
  numeración "01..12", nombre en display y count discreto. Reemplaza
  el chip-list largo.
- **Historia destacada** full-width oscura, tipografía monumental.
- **Cierre** con CTA "Sumar el mío" + columna "Qué es esto" separada
  por línea vertical.

### Cards: nuevas variantes
- `default` — aspect 4/3, categoría como texto editorial arriba del
  nombre (no badge sobre foto).
- `featured` — aspect 5/6, mini badge "Destacado", footer con barrio +
  flecha hover.
- `editorial` — sin contenedor; foto 4/5 + texto debajo, ideal para
  bloques magazine.
- `compact` — fila horizontal con thumb 64×64, para sidebars/listas.

### Fase 3 — Sistema de cards (cerrada)
Las cuatro variantes (`default`, `featured`, `editorial`, `compact`)
están en `BusinessCard.tsx` y se usan acorde a su contexto: home con
`featured` + `editorial`, `/explorar` con `default`, espacio reservado
para `compact` en sidebars admin si llega a hacer falta.

### Fase 4 — UX de exploración (cerrada)
- `Filters.tsx` reescrito: **buscador protagonista** como input editorial
  con borde inferior grueso y tipografía display 3xl (sin píldora, sin
  ícono pintón), **dropdown sobrio de rubro** con label "RUBRO" en eyebrow
  y panel scrollable con max-height (reemplaza la grilla larga de
  chips), **filtros avanzados colapsables** detrás de un botón "Filtros"
  con badge del contador. Barrio y atributos solo aparecen al abrir
  avanzados, dentro de un panel cálido.
- `/explorar/page.tsx`: header editorial con `display-xl` 7xl, contador
  como `.metric`, gap de grilla 6/8 (más aire), empty state rediseñado
  como bloque editorial que invita a "Necesito algo" cuando no hay
  resultados.

### Fase 5 — Ficha `/e/[slug]` (cerrada)
- **Hero de la ficha:** layout 7+5 columnas. Imagen dominante 4/3 (4/5
  en mobile), categoría como dateline acento, nombre con `display-xl`
  7xl, descripción a tipografía grande.
- **Atributos como dato editorial:** en lugar de pills azules
  ("Envío", "Online", "Cita"), ahora aparecen como tipografía pequeña
  con tracking ancho ("ENVÍA A DOMICILIO · CON CITA PREVIA") sobre
  línea divisoria.
- **Contacto reorganizado:** WhatsApp como botón verde grande de 14
  con el número visible a la derecha; Instagram y Web como botones
  secundarios sobrios (border fino, sin pill) en grid 2 columnas.
- **Tags:** sin pills, como hashtags con prefijo `#` discreto.
- **Historia:** sección full-width sobre `--color-surface-warm`,
  tipografía display 6xl, body 20px con line-height 1.7 y font-light,
  ancho centrado 4xl para legibilidad editorial.
- **Mapa:** título editorial + "Cómo llegar →" como CTA subrayado.
- **Reacciones:** bloque con copy editorial a la izquierda ("Dejá una
  buena vibra. Sin estrellas, sin reseñas. Solo reconocer."), bar más
  alta (h-11) con borde grueso y emoji más grande.

### Pendientes
- **Foto real del hero de la home:** cuando lleguen las imágenes del
  cliente, reemplazar `<HeroVisualPlaceholder />` en
  `src/app/page.tsx` por un componente con foto/collage real.
- **Depuración de tokens:** auditar variables CSS que quedaron sin uso
  tras el refresh y eliminar las muertas.
- **Páginas restantes:** `/sumarte`, `/necesito`, `/como-funciona`,
  `/mi-emprendimiento`, `/editar` siguen con el sistema previo pero
  funcionales con la paleta nueva. Repaso editorial liviano cuando
  haga falta.

---

## Extensiones (fuera del CLAUDE.md original) — 2026-05-27

A pedido del cliente, sumamos 4 features. Schema versionado: migración
`0001_reactions_campaigns_geo.sql`.

### Reacciones positivas
- Tabla `reactions(id, business_id, kind, anon_id, created_at)` con
  `unique(business_id, kind, anon_id)`.
- Identidad anónima por cookie `cf_anon` (24 bytes base64url, TTL 1 año,
  generada en el primer toggle). Una reacción por tipo por visitante por
  comercio.
- 7 tipos positivos: `heart`, `star`, `raised_hands`, `hug`, `kiss`, `fire`,
  `sparkle`. Definidos en `src/lib/reactions.ts` con emoji + label.
- Componente `<ReactionBar />` en la ficha (`/e/[slug]`) con
  `useOptimistic` para feedback instantáneo y server action `toggleReaction`.
- **Excepción al CLAUDE.md:** se usan emojis. El CLAUDE.md prohibía emojis
  en el sitio; las reacciones son feedback funcional, no copy, por eso
  hacemos esta excepción explícita.
- No hay reacciones negativas, no hay ratings, no hay rangos visibles tipo
  "4/5 estrellas". Solo conteos positivos.

### Campañas / eventos temáticos
- Tabla `campaigns(id, slug, title, description, color_hex, starts_at,
  ends_at, cta_text, cta_href, category_ids[], is_active, created_at)`.
- CRUD admin en `/admin/campanas`, `/admin/campanas/nueva`,
  `/admin/campanas/[id]`. Color picker hex, datetime-local para fechas,
  selector de rubros como chips.
- Banner `<CampaignBanner />` en la home: pill "Campaña activa" con el
  color de la campaña, título, descripción, **countdown** con `setInterval`
  si hay `endsAt`, y CTA. Se oculta automático si no hay activa o
  fuera de fecha.
- Filtro `/explorar?campana=<slug>`: aplica los `category_ids` de la
  campaña, y el header de explorar muestra el nombre/descripción.
- Seed dev viene con una campaña "Semana gastronómica" de 7 días.

### Historias destacadas
- Campos nuevos en `businesses`: `story` (text, máx 8000 chars) y
  `is_featured_story` (boolean).
- Admin editable en `/admin/emprendimientos/[id]` (fieldset "Historia"
  con textarea + checkbox "Destacar en la home").
- Render en la ficha del comercio: sección "Su historia" con titular
  editorial y respeto a saltos de línea (`whitespace-pre-wrap`).
- Sección "La historia" en la home: bloque con fondo `--color-ink`,
  imagen 4:5 a la izquierda y crónica clamp-5 + CTA a la ficha. Aparece
  solo si hay alguna `business` con `is_featured_story=true`.
- Seed deja la Panadería La Cuadra como destacada.

### Geolocalización
- Stack: **Leaflet + react-leaflet + OpenStreetMap** (gratis, sin API key).
- Columnas nuevas en `businesses`: `lat`, `lng` (`doublePrecision`).
- `<MapPicker />` en `/sumarte`: mapa interactivo, click para fijar el pin.
  Centro por defecto en San Miguel de Tucumán. Se oculta si el usuario
  marca "Solo online". Pin usa `divIcon` propio (color accent + borde
  blanco) — evita el bug clásico de íconos default de Leaflet con
  bundlers.
- Página `/mapa` con `<MapBrowser />`: muestra todos los `active` no-online
  con popup que linkea a la ficha. Centro = promedio de los pins, zoom
  adaptado al spread.
- `<MiniMap />` en la ficha del comercio: mapa pequeño, sin controles,
  drag/scroll deshabilitado, link "Cómo llegar" a Google Maps con las
  coordenadas.
- Los tres componentes Leaflet están envueltos en `dynamic(..., { ssr: false })`
  vía los archivos `*Loader.tsx` — Leaflet no es SSR-friendly.
- Admin form de business también acepta lat/lng manual (numéricos).
- Seed: 4 emprendimientos tienen coordenadas (Yerba Buena, Tucumán capital).

---

## Bug "botones negros sin contraste"

Reportado por el usuario en la iteración anterior. Diagnóstico:
- Era cache del browser. El refactor de diseño ya había reemplazado
  el botón de WhatsApp por `bg-[#25D366]` + ícono SVG inline.
- Todos los `bg-[var(--color-ink)]` actuales son botones legítimos con
  texto contrastado (`text-[var(--color-bg)]` crema sobre tinta).
- Solución: hard reload (`Ctrl+Shift+R`).

---

## Refresh de diseño "tipo agencia" (2026-05-27)

- Tipografías: **Poppins** display (700/600) + **Inter** body (Google
  Fonts self-hosted en build).
- Paleta más contrastada: bg `#f5efe4`, ink `#14110d`, accent `#c4502c`,
  secundario `#1f3a5f`. Variables CSS en `globals.css`.
- Componentes globales: `<SiteHeader />` sticky con logo + nav + CTA
  pill, `<SiteFooter />` con grid de 4 columnas + disclaimer separado.
- `<Button />` ahora pill-shape, con soporte de `iconLeft`/`iconRight`,
  variants `primary | secondary | ghost | accent`.
- `<BusinessCard />` con imagen dominante 4:3 (o 16:10 en featured),
  hover con `ArrowUpRight`, tag de categoría flotante.
- Hero asimétrico (7+5 cols), featured business card al costado.
- Sección de categorías como **chips clickeables con contadores** (no
  más select escondido).
- CTAs de contacto en ficha con íconos brand-correct: WhatsApp verde
  `#25D366` + SVG oficial, Instagram outline + gradient radial real,
  Web outline + globo.
- Atributos del comercio (envío/online/cita) como pills azules con
  íconos Lucide.
- Iconografía UI con **Lucide React**; íconos de marca con SVGs
  inline en `src/components/icons/Brand.tsx`.

---

## Fase 0 — Bootstrap ✅
(Detallado en el commit anterior. Resumen: Next 16 + TS + Tailwind v4 + Drizzle + Postgres 16
en docker; UI base, layout `noindex`, tipografías Fraunces+Inter, paleta de la sección 9 del CLAUDE.md.)

---

## Fase 1 — Sitio público read-only ✅

- `pnpm seed:dev`: 12 categorías de la sección 6 del CLAUDE.md, 14 familias semilla
  (`is_seed=true`, `validated=true`), 8 emprendimientos demo activos con foto generada
  por sharp (placeholder de color sólido). También crea el admin inicial si están
  `INITIAL_ADMIN_*` en env.
- `src/app/page.tsx` (landing): hero editorial con copy de la sección 9, stats
  (emprendimientos activos / familias validadas / rubros), "Recién sumados" con
  los 6 últimos, mini-explicador, link a `/como-funciona`. Forzada dinámica para
  que los stats sean frescos.
- `src/app/explorar/page.tsx`: grid con búsqueda por nombre/descripción (ILIKE),
  filtro por rubro, barrio, y toggles booleanos `envia`/`online`/`cita`. Filtros
  en client component `src/components/Filters.tsx` con `useTransition` y
  `router.replace` (URL como state).
- `src/app/e/[slug]/page.tsx`: ficha con foto grande, descripción, tags, contacto
  (WhatsApp armado a `wa.me/`, IG `instagram.com/`), botón web. `generateMetadata`
  con `robots: noindex`.
- `src/app/como-funciona/page.tsx`: explicativo con disclaimer prominente y los
  3 pasos del flujo.
- `src/app/api/image/[id]/[size]/route.ts`: sirve `storage/businesses/{id}-{size}.webp`
  con `Cache-Control: public, max-age=2592000, immutable`. Devuelve 404 si no existe.
- `BusinessCard` en `src/components/BusinessCard.tsx` (server-friendly).
- Lighthouse mobile: pendiente (no se puede correr en este entorno; chequear en
  staging post-deploy).

---

## Fase 2 — Admin ✅

- Login admin en `/admin/login` con bcrypt + iron-session. Cookie name
  configurable por `ADMIN_SESSION_COOKIE_NAME`.
- Auth check por página vía `requireAdmin()` en `src/lib/admin-guard.ts`
  (no usamos `middleware.ts` ni `proxy.ts` — la skill `nextjs-validator`
  decía que Next 16 expone `next/proxy` pero **no existe en `next@16.2.6`**.
  El layout de admin renderiza solo el shell si no hay sesión).
- Dashboard `/admin` con contadores por status, validaciones pendientes,
  validaciones que vencen en < 2 días, últimos 8 eventos.
- CRUD familias: `/admin/familias` (listado paginado con búsqueda),
  `/admin/familias/nueva`, `/admin/familias/[id]`. Form con `useActionState`,
  toggle `isSeed` y `validated`, notas internas.
- CRUD emprendimientos: `/admin/emprendimientos` (listado con filtro por status,
  search por nombre/mail), `/admin/emprendimientos/[id]` (editor completo +
  vista de validadores). Acciones: forzar status, editar todo, eliminar.
- CRUD categorías: `/admin/categorias` (alta inline + edición en línea).
  Borrar protegido por FK (si hay emprendimientos asociados, falla silenciosa).
- Logs `/admin/logs` con filtro por tipo, chips de tipos frecuentes, paginación.
- Todas las acciones loguean a `events` (`admin.login`, `business.updated`,
  `business.status.active`, `category.created`, etc).

---

## Fase 3 — Registro con validación entre pares ✅

- `/sumarte`: form completo en `SubmitForm` (client). Subida de foto vía
  `<input type="file">` y Server Action multipart. `sharp` genera `orig`/`card`/`thumb`
  en webp.
- Typeahead de validadores via Server Action `searchValidators` (busca solo
  familias `validated=true`). UI: chips removibles, 3 slots fijos.
- Validación zod:
  - Mínimo un WhatsApp o un Instagram.
  - 3 validadores únicos (no duplicados).
  - Dueño no puede ser uno de los validadores.
  - Tamaño foto ≤ `MAX_UPLOAD_SIZE_MB`.
  - Tags max 5.
- Persistencia atómica:
  - Inserta `business` con `status='pending'`.
  - Procesa foto. Si falla, hace rollback del row.
  - Inserta 3 `validation_requests` con tokens únicos y `expiresAt = +7 días`.
- Mails: `templates.validationRequest` a cada validador, `templates.applicantAck`
  al solicitante. Si `SMTP_HOST` está vacío, se loguean por consola en dev.
- `/validar/[token]`: muestra info pública del emprendimiento (foto, nombre,
  rubro, barrio) + dos botones grandes. Sin captcha, sin paso adicional.
- `respondValidation`: marca el request, registra en `events`, y si llegan
  2 `approved` para un business `pending`, lo pasa a `active`, crea un
  `access_token` `edit_business` de 30 días, y manda mail al dueño con la URL
  pública y el link de edición.
- Expiración: hecha "on-request" (`expireOld()` corre al inicio de
  `inspectValidation` y `respondValidation`). No hay cron — el admin igual
  puede ver las que vencen pronto en el dashboard.

---

## Fase 4 — Magic link de edición ✅

- `/editar`: form pide el mail; siempre responde el mismo mensaje de éxito
  (no revela si el mail existe).
- Si el mail tiene un business `active`: genera `access_token`
  `edit_business` por 24h y manda mail con link.
- `/editar/[token]`: consume el token (marca `usedAt`), abre `owner_session`
  con `{ businessId, email }`, redirige a `/mi-emprendimiento`.
- `/mi-emprendimiento`: form restringido (descripción, dirección, barrio,
  WhatsApp, IG, web, toggles, tags). No deja editar `name`, `slug`, `status`,
  `categoryId`, `photo`, `ownerEmail`. Botón "Cerrar sesión" que destruye
  la cookie del owner.
- Sesiones owner y admin usan cookies separadas (`OWNER_SESSION_COOKIE_NAME`,
  `ADMIN_SESSION_COOKIE_NAME`).

---

## Fase 5 — Polish + deploy ✅

- `Dockerfile` multi-stage (deps → builder → prod-deps → runner) con tini y
  user `nextjs` (UID 1001).
- `.dockerignore` para no copiar `node_modules`, `.next`, `.git`, `.env`, etc.
- `docker-compose.prod.yml` con healthcheck en `db`, `app` solo en
  `127.0.0.1:3000`, volumen `storage` para fotos, volumen `db_data` para
  Postgres.
- `deploy/nginx.conf.example`: proxy_pass a `127.0.0.1:3000`, cache-header
  largo en `/api/image/`, `X-Robots-Tag: noindex,nofollow`.
- `deploy/deploy.sh`: `git pull` + `compose build` + migrate + `nginx reload`.
- `deploy/backup-db.sh`: `pg_dump | gzip` a `/var/backups/comunidad-fasta/`
  con rotación de 14 días.
- `README.md` con instrucciones de local + deploy completo + operación.

### Lo que queda fuera de scope técnico
- Lighthouse score real (correr en staging con el dominio puesto).
- Fotos reales (vienen del cliente; el seed deja placeholders sólidos).
- DNS y SSL (depende del dominio elegido).
- UI para cambiar password admin (hoy se hace por SQL — documentado en README).

---

## Decisiones que se apartaron del CLAUDE.md

| CLAUDE.md decía | Hicimos | Por qué |
|---|---|---|
| Next 15 | Next 16.2.6 | `create-next-app@latest` instaló 16. Todo lo del stack sigue funcionando. |
| `src/app/fonts/` | `next/font/google` (Fraunces + Inter) | Self-hostea en build, no toca Google en runtime — satisface el espíritu. |
| `middleware.ts` para tenant init / admin | Auth check por página con `requireAdmin()` | Next 16 hace medio raros los middlewares; per-page es explícito y testeable. |
| Cron diario para expirar `validation_requests` | "on-request" en cada respuesta/inspección | El CLAUDE.md aceptaba ambas. Esto evita scheduler y mantiene el deploy más simple. |
| Postgres en 5432 | 5434 en host (5432 dentro del container) | Conflicto con otros proyectos en la misma máquina dev. En prod no expone puertos. |
| `sharp` no listado en CLAUDE.md como dep | Agregado como dep directa (`sharp@^0.34.5`) | TypeScript no lo resolvía vía transitiva. |

---

## Cómo correr todo localmente

```powershell
pnpm install
pnpm db:up
pnpm db:migrate
pnpm seed:dev

# (opcional) ver mails en una UI:
docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
# editar .env.local: SMTP_HOST=localhost, SMTP_PORT=1025

pnpm dev   # http://localhost:3000
# o
pnpm build && pnpm start
```

Login admin local: `admin@comunidad-fasta.local` / `admin1234`.

Probado:
- `tsc --noEmit` limpio.
- `next build` (Turbopack) verde con las 21 rutas.
- 200 OK en `/`, `/explorar`, `/explorar?cat=...`, `/como-funciona`, `/sumarte`,
  `/editar`, `/admin/login`, `/e/{slug}`.
- 307 en `/admin` y `/mi-emprendimiento` sin sesión (redirigen a su login).
- 404 en `/api/image/{id_inexistente}/card`.
- Image API devuelve `image/webp` con ~930 bytes para el placeholder generado.

---

## Variables de entorno mínimas en prod

Ver `.env.example`. Las críticas:

- `APP_URL` (sin barra final, p. ej. `https://comunidad-fasta.example.com`)
- `DATABASE_URL`
- `SESSION_PASSWORD` (32+ chars)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM`
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` (sólo para el seed inicial — borrar luego)

---

## Lo que sigue (post-cliente)

1. Reemplazar el seed dev con datos reales (familias y emprendimientos pasados por
   la organización).
2. Correr Lighthouse mobile en staging.
3. Decidir el acento definitivo: terracota `#A84F33` o azul `#1F3A5F` con las
   fotos reales.
4. Configurar Plausible self-hosted si el cliente eventualmente quiere métricas.
