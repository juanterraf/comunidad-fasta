# Comunidad FASTA

> Plataforma simple, visual y colaborativa para descubrir emprendimientos, comercios, oficios y servicios de familias, docentes y miembros de la comunidad FASTA — Colegio Boisdron, Tucumán, Argentina.

**Slug del proyecto / repo / carpeta:** `comunidad-fasta`

---

## 1. Identidad y copy maestro

**Nombre:** Comunidad FASTA
**Slogan:** *Lo que somos, lo que hacemos, lo que compartimos.*
**Bajada:** Un espacio para descubrir talentos, servicios, comercios y proyectos de las familias que forman parte de la comunidad FASTA.
**Frase larga (para la sección "qué es esto"):** Una plataforma simple, visual y colaborativa para descubrir emprendimientos, comercios, oficios y servicios de familias, docentes y miembros de la comunidad FASTA.

**Disclaimer obligatorio (texto exacto):**
> Comunidad FASTA es una iniciativa de familias. No es un sitio oficial de FASTA ni del Colegio Boisdron.

Va en el footer de todas las páginas (estilo discreto pero legible: 12px, color secundario) y en una línea visible al inicio de `/como-funciona`.

### Etiquetas conceptuales (vocabulario rector)

Estas no son categorías de filtrado. Son el vocabulario que tiene que respirar en el copy del sitio, en los mails, en los micro-textos. Si una palabra del sitio no rima con este vocabulario, está fuera.

- **Comunidad:** familias, docentes, egresados, vínculos, confianza, pertenencia, cercanía.
- **Emprendimiento:** comercios, servicios, oficios, proyectos, profesionales, talentos, trabajo.
- **Conexión:** red, contacto, recomendación, búsqueda, mapa, encuentro, colaboración.
- **Propósito:** elegir cerca, fortalecer comunidad, visibilizar proyectos, acompañar esfuerzos, generar oportunidades.
- **Acción:** buscar, descubrir, registrar, validar, contactar, recomendar, compartir.

Frase guía interna (no aparece textual en el sitio): *"Antes de buscarlo afuera, fijate si lo hace alguien de la comunidad."*

---

## 2. Qué es y qué no es

Es un directorio donde se concentran los emprendimientos, oficios y servicios que ofrecen las familias, docentes, egresados y miembros de la comunidad FASTA. La confianza no se construye con reseñas ni con estrellas: se construye con el hecho de pertenecer a la comunidad. Para sumarse, dos familias **ya validadas** tienen que confirmar que conocen al solicitante.

**No es** marketplace, no hay transacciones, no hay comisiones, no hay calificaciones públicas. **Es** una vidriera con un filtro de pertenencia.

El motor de fondo: en un contexto económico difícil, queremos que comprarle a alguien de la comunidad sea lo natural, no la excepción. Sin pedir nada gratis, sin donaciones — solo vincular oferta y demanda que ya están dentro de la comunidad.

---

## 3. Reglas duras (no negociables)

- **Nunca usar Supabase, Firebase, Auth0, Clerk ni ningún BaaS.** Todo corre self-hosted en el VPS Hostinger del cliente.
- **No hay login con usuario y contraseña para usuarios finales.** Solo magic links por mail con token de un solo uso.
- **El sitio es público pero no indexable.** `<meta name="robots" content="noindex,nofollow">` en todas las rutas. Sin sitemap público. Sin Open Graph rico (apenas un title/desc neutros). No queremos que aparezca en Google.
- **Disclaimer "no es iniciativa oficial" visible en footer de todas las páginas**, con la redacción exacta del punto 1. No omitir, no parafrasear.
- **Nunca exponer la lista de validadores de un emprendimiento.** Solo el admin la ve. Para los demás, un emprendimiento "está validado" y punto.
- **Mobile-first.** Más del 80% va a entrar desde el celular en la fila del cole. Si algo se ve bien en desktop pero mal en mobile, está mal.
- **Una sola foto por emprendimiento** en v1. Procesada con `sharp` al subir (resize + webp + thumbnail). No se delega a un CDN externo.
- **Voseo siempre.** Es Argentina, no usamos "tú". Las copys son breves, en minúscula cuando puede, editoriales — no corporativas.
- **No hay tracking de terceros.** Ni GA, ni Meta Pixel, ni Hotjar, nada. Eventualmente, si se necesita, Plausible self-hosted en el mismo VPS.
- **Cero animaciones decorativas.** Las transiciones existen para dar feedback, no para impresionar.
- **El vocabulario del sitio respeta las etiquetas conceptuales del punto 1.** Si dudás de una palabra, está fuera.

---

## 4. Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC, Server Actions) | Server Components reducen JS al cliente; Server Actions evitan armar API routes para forms simples |
| Lenguaje | **TypeScript** con `"strict": true` | Sin excepciones |
| DB | **PostgreSQL 16** | Maduro, jsonb cuando hace falta, full-text search nativo |
| ORM | **Drizzle ORM** | SQL-near, migraciones versionables, sin runtime overhead |
| CSS | **Tailwind CSS v4** | Sin librería de componentes encima |
| Validación | **Zod** | Para todos los inputs de forms y server actions |
| Sesiones | **iron-session** | Cookies firmadas, sin DB de sesiones. Solo admin y "editor magic-link" |
| Mail | **Nodemailer** + SMTP | Cuenta SMTP de Hostinger o cualquier otra; sin Resend ni terceros |
| Imágenes | **sharp** | Resize, conversión a webp, generación de thumbs al subir |
| Orquestación | **Docker Compose** | Servicios: `app` (Next), `db` (Postgres). Nada más adentro |
| Reverse proxy | **Nginx en el host** (no en docker) | Para que Certbot/Let's Encrypt sea sin dolor |

### Cosas que NO usamos
Supabase, Firebase, Prisma, NextAuth/Auth.js, shadcn/ui, Tailwind UI, Cloudinary, Resend, Vercel, Neon, PlanetScale, Google Analytics, Vercel Analytics, ningún ORM gestionado en la nube. Si alguien sugiere alguno, está fuera de scope.

---

## 5. Estructura de carpetas

```
comunidad-fasta/
├── CLAUDE.md                    # este archivo
├── STATUS.md                    # se actualiza después de cada fase: en qué estamos
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── .env.example
├── .env.local                   # gitignored
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── deploy/
│   ├── nginx.conf.example       # bloque de nginx para el host
│   ├── deploy.sh                # script idempotente para pull + restart
│   └── backup-db.sh             # dump nocturno de postgres a /var/backups/comunidad-fasta
├── public/
│   └── ...                      # solo assets estáticos del sitio (favicon, og default)
├── storage/                     # gitignored, montado como volumen — fotos subidas
│   ├── businesses/
│   │   ├── {id}-orig.webp
│   │   ├── {id}-card.webp       # 800x600
│   │   └── {id}-thumb.webp      # 200x150
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx                          # landing
    │   │   ├── explorar/page.tsx                 # listado con filtros
    │   │   ├── e/[slug]/page.tsx                 # ficha individual
    │   │   ├── sumarte/page.tsx                  # form de registro
    │   │   ├── validar/[token]/page.tsx          # endpoint para validadores
    │   │   ├── editar/page.tsx                   # form para pedir magic link
    │   │   └── como-funciona/page.tsx
    │   ├── (owner)/
    │   │   └── mi-emprendimiento/page.tsx        # panel del dueño (token en cookie)
    │   ├── (admin)/
    │   │   ├── admin/page.tsx                    # dashboard
    │   │   ├── admin/familias/page.tsx
    │   │   ├── admin/emprendimientos/page.tsx
    │   │   ├── admin/categorias/page.tsx
    │   │   ├── admin/logs/page.tsx
    │   │   └── admin/login/page.tsx
    │   ├── api/
    │   │   └── image/[id]/[size]/route.ts        # sirve fotos del storage local
    │   └── layout.tsx
    ├── components/
    │   ├── ui/                                   # Button, Input, Select, etc. — propios
    │   ├── BusinessCard.tsx
    │   ├── Filters.tsx
    │   ├── Hero.tsx
    │   ├── Disclaimer.tsx                        # banner pequeño en footer
    │   └── ...
    ├── db/
    │   ├── schema.ts                             # tablas drizzle
    │   ├── index.ts                              # cliente drizzle
    │   └── migrations/
    ├── lib/
    │   ├── auth.ts                               # iron-session helpers
    │   ├── mail.ts                               # nodemailer wrapper
    │   ├── tokens.ts                             # generación y verificación
    │   ├── images.ts                             # sharp pipeline
    │   ├── slugify.ts
    │   └── log.ts                                # logger de eventos a tabla `events`
    ├── actions/                                  # server actions
    │   ├── businesses.ts
    │   ├── families.ts
    │   ├── validation.ts
    │   └── admin.ts
    └── styles/
        └── globals.css
```

---

## 6. Modelo de datos

### Tablas

**`families`** — Familias, docentes, egresados, miembros de la comunidad. Algunas son "semilla" (cargadas manualmente al inicio) y pueden validar a otras.
```
id              uuid pk
email           text unique not null
display_name    text not null            -- "Juan y Mariana Pérez"
phone           text
role            text                     -- 'familia' | 'docente' | 'egresado' | 'otro'
is_seed         boolean default false    -- las 10-15 iniciales que cargás vos
validated       boolean default false    -- true si fue aprobada (semilla → true automático)
validated_at    timestamptz
notes           text                     -- notas internas del admin (no visibles a nadie más)
created_at      timestamptz default now()
```

**`children`** — Hijos en el cole. Una familia puede tener varios. Opcional (los docentes/egresados pueden no tener).
```
id              uuid pk
family_id       uuid fk → families
first_name      text
grade           text                     -- "5to B", "3er año", etc. texto libre
level           text                     -- 'inicial' | 'primario' | 'secundario'
created_at      timestamptz
```

**`categories`** — Rubros concretos para filtrar.
```
id              uuid pk
slug            text unique
name            text
icon            text                     -- nombre del icono tabler, ej. "meat"
display_order   int
```

Categorías iniciales del seed:
- Alimentos y bebidas
- Indumentaria y accesorios
- Servicios del hogar
- Salud y bienestar
- Educación y clases
- Diseño y oficios
- Servicios profesionales
- Tecnología
- Eventos y catering
- Belleza y cuidado personal
- Niños y juegos
- Otros

**`businesses`** — Los emprendimientos.
```
id              uuid pk
slug            text unique
name            text not null
description     text                     -- máx 500 chars
address         text                     -- libre, no geocoded en v1
neighborhood    text                     -- "Yerba Buena", "Tucumán capital", etc.
category_id    uuid fk → categories
photo_filename  text                     -- referencia al archivo en /storage/businesses/
status          text default 'pending'   -- 'pending' | 'active' | 'paused' | 'rejected'
owner_email     text not null            -- el mail para magic-link de edición
owner_family_id uuid fk → families       -- solo si la familia ya estaba validada antes
whatsapp        text                     -- formato E.164 sin +
instagram       text                     -- handle sin @
website         text
delivers        boolean default false
online_only     boolean default false
by_appointment  boolean default false
tags            text[]                   -- libre, máx 5
created_at      timestamptz default now()
approved_at     timestamptz
```

**`validation_requests`** — Cada pedido de validación entre pares.
```
id                  uuid pk
business_id         uuid fk → businesses
validator_family_id uuid fk → families
token               text unique
status              text default 'pending'   -- 'pending' | 'approved' | 'rejected' | 'expired'
created_at          timestamptz
responded_at        timestamptz
expires_at          timestamptz              -- 7 días
```

**`access_tokens`** — Magic links (edición de emprendimiento propio, etc.)
```
id          uuid pk
token       text unique
email       text not null
purpose     text                            -- 'edit_business' | 'admin_pwreset' | ...
target_id   uuid                            -- ej. business_id
expires_at  timestamptz                     -- 24h para edit
used_at     timestamptz
created_at  timestamptz default now()
```

**`admin_users`** — Login del admin. Pocos registros (1-3).
```
id             uuid pk
email          text unique
password_hash  text                          -- bcrypt
created_at     timestamptz
```

**`events`** — Log de eventos (auditoría liviana).
```
id           uuid pk
type         text                            -- 'business.created', 'validation.approved', etc.
actor_email  text
entity_type  text
entity_id    uuid
metadata     jsonb
created_at   timestamptz default now()
```

### Índices útiles
- `businesses(status, category_id)` — listado público
- `businesses USING gin(to_tsvector('spanish', name || ' ' || description))` — búsqueda
- `businesses USING gin(tags)`
- `families(email)`, `access_tokens(token)`, `validation_requests(token)`

---

## 7. Flujos clave

### 7.1 Registro de un emprendimiento (auto-servicio)

1. Usuario va a `/sumarte`.
2. Completa: nombre, descripción, rubro (de lista), dirección/barrio, foto, contacto (al menos uno de WhatsApp o IG), tags opcionales, y **su mail**.
3. Indica **3 familias/miembros validados** que lo conocen (typeahead: solo autocompleta entre `families` con `validated=true`). Debe elegir 3, no 2, por si alguno no responde.
4. El sistema:
   - Crea el `business` con `status='pending'`.
   - Crea 3 `validation_requests` con tokens únicos.
   - Envía mail a cada uno de los 3 validadores: *"Hola [Nombre], [Solicitante] está sumando su emprendimiento a Comunidad FASTA. ¿Lo/la conocés de la comunidad? [Sí, lo conozco] [No]"*.
   - Envía mail al solicitante: *"Recibimos tu pedido. Avisamos a tres miembros de la comunidad. Cuando dos confirmen, sale al aire."*.
5. Cuando llegan **2 aprobaciones** → `status='active'` automático, mail al dueño con el link permanente al emprendimiento y el link para editar.
6. Si pasan 7 días sin 2 aprobaciones → `status='expired'` y el admin lo ve para resolver a mano.

### 7.2 Validación por parte de un miembro

1. Llega mail con link `https://comunidad-fasta.../validar/{token}`.
2. La página muestra: nombre del emprendimiento, descripción corta, foto, nombre del solicitante, y dos botones grandes: **"Sí, lo/la conozco"** y **"No lo/la conozco"**.
3. Click → marca `validation_requests.status` y registra en `events`.
4. No hay loops, no hay segunda confirmación, no hay edición. Un click y listo.
5. Si el token está usado o expirado → mensaje claro, sin opción de reabrir.

### 7.3 Edición de un emprendimiento propio (magic link)

1. Dueño va a `/editar`.
2. Ingresa su mail.
3. Si el mail está asociado a un business `active` → se genera `access_token` (24h), se manda al mail, y se redirige con mensaje *"te mandamos un link a tu mail"*. Si el mail no existe → mismo mensaje (no se revela si existe o no).
4. Click en el link → se setea cookie `iron-session` con `{ business_id, expires_at }`, redirige a `/mi-emprendimiento`.
5. Form de edición de SUS campos (no puede cambiar `status`, no puede cambiar `owner_email`, no puede ver validadores).
6. Cambio de mail propietario requiere intervención del admin.

### 7.4 Admin

1. Login en `/admin/login` con email + password (bcrypt, en `admin_users`).
2. Dashboard: contadores (emprendimientos pending, validaciones expirando, últimos eventos).
3. CRUD `families` con campo `is_seed`. La carga inicial de 10-15 semilla la hace acá.
4. CRUD `businesses`: forzar aprobar, pausar, rechazar, editar cualquier cosa, ver validadores.
5. CRUD `categories`.
6. Vista de `events` con filtros por tipo y fecha.
7. Una sola cuenta admin por defecto. La password inicial se setea con un script de seed.

---

## 8. Convenciones de código

- **Server Actions** para todos los forms. No armar API routes salvo que sea estrictamente necesario (ej. servir imágenes).
- **Validar inputs con Zod** dentro de cada server action. El schema vive cerca del action.
- **Sin `useEffect` para fetching.** Siempre Server Components + Server Actions.
- **`'use client'` solo donde hay interactividad de verdad** (filtros del listado, typeahead de validadores, botón con confirmación).
- **Nombres en inglés en el código** (tables, columns, funciones), **copys en español** (estrictamente rioplatense, voseo).
- **Slugs**: generar con `slugify` propio (sin acentos, en minúscula, con guiones). El admin puede editarlos.
- **Errores nunca crudos al usuario.** Mensajes humanos. Stack traces solo a `events` o consola.
- **Tipos en `src/db/schema.ts`**: usar `InferSelectModel` / `InferInsertModel` de drizzle. Re-exportar como `Family`, `Business`, etc.
- **No comentarios obvios.** Comentar solo el "por qué", nunca el "qué".

---

## 9. Voz y diseño visual

### Tono
Editorial, breve, cálido, sin exclamaciones, sin emojis en el sitio (en mails, máximo uno y solo si suma claridad). Ejemplos:

- ❌ "¡Bienvenido a la comunidad! Estamos felices de tenerte." → ✅ "Bienvenida a Comunidad FASTA."
- ❌ "Tu solicitud ha sido enviada exitosamente." → ✅ "Recibimos tu pedido. Avisamos a tres miembros de la comunidad, cuando dos confirmen sale al aire."
- ❌ "Acerca de nosotros" → ✅ "Cómo funciona", "Qué es esto"

### Hero de la landing (texto base, editable)

Pre-titular pequeño (mayúsculas espaciadas, color secundario):
> COMUNIDAD FASTA · COLEGIO BOISDRON · TUCUMÁN

Titular grande (serif):
> Lo que somos, lo que hacemos, lo que compartimos.

Subtitular (sans, color secundario):
> Un espacio para descubrir talentos, servicios, comercios y proyectos de las familias que forman parte de la comunidad FASTA.

CTA primario: *Explorar emprendimientos →*
CTA secundario: *Sumar el mío*

### Tipografía
Headings con serif (`var(--font-serif)`). Body con sans humanista. Combo recomendado de Google Fonts: **Fraunces** (serif, optical sizing, peso 400/500) + **Inter** (sans, peso 400/500). Tamaño base 16px, line-height 1.6 en body, 1.05 en display.

### Paleta
- Fondo: crema (`#F8F4ED`)
- Tinta: casi negra (`#1A1814`)
- Secundario (texto suave): `#6B6760`
- Bordes: `#E5DFD3`
- Acento (a definir al ver el sitio con fotos reales en Fase 1): terracota apagado `#A84F33` *o* azul profundo `#1F3A5F`.

Sin gradientes, sin sombras decorativas, sin glassmorphism, sin gimmicks. La estética se logra con tipografía, espacio en blanco y consistencia.

### Disclaimer (componente `<Disclaimer />`)
Footer, separado por un border-top sutil, font-size 12px, color secundario:

> Comunidad FASTA es una iniciativa de familias. No es un sitio oficial de FASTA ni del Colegio Boisdron.

---

## 10. Plan de implementación por fases

Cada fase termina actualizando `STATUS.md` con qué quedó hecho y qué falta. Una fase no arranca hasta que la anterior está cerrada.

### Fase 0 — Bootstrap (1-2 días)
- [ ] `pnpm create next-app` con TS, Tailwind v4, App Router
- [ ] `docker-compose.yml` con postgres 16 + healthcheck
- [ ] Instalar drizzle, drizzle-kit, sharp, nodemailer, iron-session, zod, bcrypt
- [ ] Configurar drizzle, crear `schema.ts` con todas las tablas, generar y correr primera migración
- [ ] `.env.example` completo
- [ ] Tipografías locales (Fraunces + Inter) en `src/app/fonts/`
- [ ] Variables CSS en `globals.css` (paleta, radios, espaciados)
- [ ] Componentes UI base: `Button`, `Input`, `Select`, `Textarea`, `Tag`, `Disclaimer`
- [ ] Layout raíz con `<meta name="robots" content="noindex,nofollow">` global
- [ ] Footer global con `<Disclaimer />`

### Fase 1 — Sitio público read-only (2-3 días)
- [ ] Seed manual de categorías, 10-15 familias semilla, 6-8 emprendimientos demo (todo via script `pnpm seed:dev`)
- [ ] Landing `/`: hero editorial con copy del punto 9, mini-explicador con vocabulario del punto 1, stats, "recién sumados", footer con disclaimer
- [ ] `/explorar`: grid con búsqueda por nombre, filtro por categoría, filtros booleanos (envía, online, con cita), filtro por barrio, chips de tags
- [ ] `/e/[slug]`: ficha con foto grande, datos, botón WhatsApp (`https://wa.me/...`), botón IG
- [ ] `/como-funciona`: página explicativa con el flujo de validación y el disclaimer prominente
- [ ] Endpoint `/api/image/[id]/[size]` sirve desde `/storage/businesses/`
- [ ] 100% server components salvo filtros del listado
- [ ] Mobile-first verificado en 360px, 768px, 1280px

### Fase 2 — Admin con CRUD (2 días)
- [ ] Login admin con bcrypt + iron-session
- [ ] Middleware `/admin/*` que requiere sesión
- [ ] Dashboard con contadores
- [ ] CRUD families (con búsqueda, paginación, toggle de `is_seed`, campo `role`)
- [ ] CRUD businesses (force-approve, pause, reject, edit completo, ver validadores)
- [ ] CRUD categories (drag para reordenar opcional)
- [ ] Vista de events con filtros
- [ ] Script de seed que crea el admin inicial leyendo de env

### Fase 3 — Registro con validación entre pares (3 días)
- [ ] Form `/sumarte` con upload de foto (sharp procesa al guardar)
- [ ] Typeahead de validadores (server action busca en familias activas, devuelve max 5)
- [ ] Validación zod de la combinación 3 únicos, dueño no se autovalida
- [ ] Cron diario o on-request: marca `validation_requests` expiradas
- [ ] Plantillas de mail (HTML + text fallback) para validador y para solicitante
- [ ] Página `/validar/[token]` con UX clara
- [ ] Auto-aprobación al recibir 2 yes → mail al dueño con su magic link de edición

### Fase 4 — Magic link de edición (1 día)
- [ ] Form `/editar` que solicita mail
- [ ] Generación de token, mail con link
- [ ] `/mi-emprendimiento`: form de edición restringido (sin status, sin email)
- [ ] Cookie de sesión `owner_session` por separado de admin

### Fase 5 — Polish + deploy (2 días)
- [ ] Reemplazar seed dev con datos reales que pase el cliente
- [ ] Lighthouse 90+ en mobile en `/` y `/explorar`
- [ ] Backup nocturno de postgres a `/var/backups/comunidad-fasta/` con rotación de 14 días
- [ ] Nginx configurado en el host con SSL (Certbot)
- [ ] Variables de entorno productivas seteadas
- [ ] Script `deploy/deploy.sh`: `git pull && docker compose -f docker-compose.prod.yml up -d --build`
- [ ] DNS apuntando, smoke test productivo
- [ ] README de operación para el cliente

---

## 11. Variables de entorno (`.env.example`)

```env
# App
APP_NAME="Comunidad FASTA"
APP_URL=https://comunidad-fasta.example.com
NODE_ENV=development

# Database
DATABASE_URL=postgres://comfasta:comfasta@localhost:5432/comfasta
POSTGRES_USER=comfasta
POSTGRES_PASSWORD=changeme
POSTGRES_DB=comfasta

# Sessions
SESSION_PASSWORD=cambiar-esto-por-32-chars-random   # min 32 chars
ADMIN_SESSION_COOKIE_NAME=cf_admin
OWNER_SESSION_COOKIE_NAME=cf_owner

# Admin bootstrap (solo se usa en seed inicial)
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=

# Mail (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="Comunidad FASTA <hola@comunidad-fasta.example.com>"

# Storage
STORAGE_PATH=/app/storage
MAX_UPLOAD_SIZE_MB=8
```

---

## 12. Deploy en VPS Hostinger

Asumimos un VPS con Ubuntu 22.04+, acceso root, dominio apuntando vía A record.

1. Instalar docker + docker-compose-plugin + nginx + certbot.
2. `git clone` en `/var/www/comunidad-fasta`.
3. Copiar `.env.example` a `.env`, completar valores productivos.
4. `docker compose -f docker-compose.prod.yml up -d --build`.
5. Configurar nginx con bloque server que haga `proxy_pass http://127.0.0.1:3000`.
6. `certbot --nginx -d comunidad-fasta.example.com`.
7. Cron: `0 3 * * * /var/www/comunidad-fasta/deploy/backup-db.sh` (backup nocturno).
8. Cron: `*/15 * * * * curl -s -o /dev/null http://localhost:3000/api/health` (keepalive opcional).

El contenedor `app` expone solo `127.0.0.1:3000` (no `0.0.0.0`). Nginx en el host es la única puerta de entrada externa.

---

## 13. Cómo seguir

Al abrir este proyecto:

1. Leer `STATUS.md` si existe — dice en qué fase estamos y qué quedó pendiente de la fase anterior.
2. Si no existe `STATUS.md`, asumir Fase 0 y empezar por el bootstrap.
3. **Antes de instalar una dependencia nueva, confirmar que no entra en conflicto con la sección "Cosas que NO usamos".**
4. **Antes de cerrar una fase, actualizar `STATUS.md`** con: qué quedó hecho, qué falta, decisiones tomadas que no estaban en este doc.
5. **Antes de mergear cualquier cambio en copy del sitio, verificar que el vocabulario respeta las etiquetas conceptuales del punto 1 y que el disclaimer sigue en su lugar.**

---

*Última actualización del CLAUDE.md: al iniciar el proyecto.*