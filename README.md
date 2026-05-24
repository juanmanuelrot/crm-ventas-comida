# BrunoWeb — CRM de ventas de comida

CRM básico para una distribuidora. Vendedores registran visitas con scoring (potencial, interés, facilidad) y el admin ve métricas globales.

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Prisma 7 + PostgreSQL (driver `@prisma/adapter-pg`)
- Auth.js v5 (NextAuth, Credentials + bcrypt, JWT sessions)
- Tailwind v4 + shadcn/ui (base-nova)
- date-fns-tz para timezone (default `America/Montevideo`)

## Setup local

### 1. Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=bruno@prueba.com
ADMIN_PASSWORD=prueba1234
ADMIN_NAME=Bruno
TIMEZONE=America/Montevideo
```

**Opciones para `DATABASE_URL` en dev local:**

- **Postgres local con Docker**:
  ```bash
  docker run --name brunoweb-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16
  # DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres
  ```
- **Prisma Postgres temporal (24h, sin setup)**:
  ```bash
  npx create-db create --ttl 24h --env .env.local
  ```
- **Apuntar al DO Managed Postgres de prod** (cuidado: estás en la DB real). Copiar el connection string desde el dashboard de DO.

### 2. Instalar, migrar, seedear

```bash
npm install
npm run db:migrate            # aplica migraciones (modo dev)
npm run db:seed               # crea el admin desde ADMIN_EMAIL/PASSWORD
npm run dev                   # http://localhost:3000
```

Login con `bruno@prueba.com` / `prueba1234`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server (turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Run de producción (lee `PORT` env) |
| `npm run db:generate` | Genera el cliente Prisma (corre automático en `postinstall`) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (producción) |
| `npm run db:seed` | Seedea el admin |
| `npm run db:studio` | Abre Prisma Studio |

## Deploy en DigitalOcean Apps

El archivo [`.do/app.yaml`](./.do/app.yaml) contiene el spec de DO App Platform. Define **tres componentes** que DO crea juntos al primer deploy:

| Componente | Qué hace |
|---|---|
| `databases.db` | **Postgres administrado de DigitalOcean** (cluster `crm-ventas-comida-db`, basic 1 vCPU / 1 GB, Postgres 16). DO inyecta `${db.DATABASE_URL}` en la app y el job. |
| `services.web` | App Next.js. Build: `npm run build`. Run: `npm start`. Auto-deploy en cada push a `main`. |
| `jobs.migrate-db` | Job pre-deploy que corre `prisma migrate deploy` antes de que arranque `web`. |

### Setup paso a paso

1. **Conectar el repo a DigitalOcean Apps**:
   - [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) → "Create App" → GitHub → seleccionar `juanmanuelrot/crm-ventas-comida`, branch `main`.
   - DO detecta el `.do/app.yaml` automáticamente. Si no aparece, elegí "Import App Spec from Source" apuntando a ese archivo.
   - El wizard te muestra: 1 servicio (web), 1 job (migrate-db) y 1 base de datos (db). Confirmá.

2. **Setear las variables marcadas como SECRET** (en *Settings → App-Level Environment Variables*):
   - `AUTH_SECRET` — generar con `openssl rand -hex 32`
   - `ADMIN_PASSWORD` — la contraseña que querés para el admin inicial

   Las demás (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_NAME`, `TIMEZONE`, `AUTH_TRUST_HOST`) ya vienen seteadas en el spec. `DATABASE_URL` se resuelve automáticamente al connection string del cluster que DO provisiona.

3. **Primer deploy**: DO crea el cluster Postgres, después corre el job `migrate-db` (aplica las migraciones), después arranca `web`. Toma unos minutos la primera vez (el cluster tarda en aprovisionarse).

4. **Seedear el admin** (solo la primera vez):
   - Panel de DO → tu app → servicio `web` → *Console*.
   - Correr: `npm run db:seed`
   - Crea el usuario admin con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
   - Re-correrlo es inocuo: el seed usa `upsert`.

5. **Listo**: la app queda en `https://crm-ventas-comida-xxxxx.ondigitalocean.app`. Login con `bruno@prueba.com` / la `ADMIN_PASSWORD` que pusiste.

### Conectarse a la base directamente

Para correr queries o `prisma studio` apuntando al Postgres de prod:

- DO te muestra el connection string en *Databases → crm-ventas-comida-db → Connection Details*.
- Copialo a `.env.local` y corré `npm run db:studio`.
- ⚠️ Es la DB real, cuidado con DELETE/UPDATE.

### Notas de deploy

- **`postinstall: prisma generate`** regenera el cliente Prisma después de cada `npm install`, tanto local como en DO.
- **`AUTH_TRUST_HOST=true`** está hardcodeado en el spec porque Auth.js necesita confiar en el header `Host` cuando corre detrás del proxy de DO.
- **JWT sessions**: la sesión vive en una cookie firmada con `AUTH_SECRET`. No requiere tabla en la DB.
- **Migraciones**: cada `git push` a `main` dispara un nuevo deploy. El job `migrate-db` aplica las migraciones pendientes antes de que el servicio web reciba tráfico (zero-downtime para migrations aditivas).
- **Custom domain**: lo configurás desde el dashboard de DO (*Settings → Domains*).

### Costo aproximado (mayo 2026)

- App service (`basic-xxs`): ~$5/mes (512 MB RAM, 1 vCPU compartida).
- Postgres (`db-s-1vcpu-1gb`): ~$15/mes (1 GB RAM, 10 GB SSD, backups diarios).
- Total: **~$20/mes**.

Si querés bajar costos para empezar, en `.do/app.yaml` cambiá la sección `databases` a:

```yaml
databases:
  - name: db
    engine: PG
    version: "16"
    production: false      # dev database tier, ~$7/mes, sin backups automáticos
```

## Estructura de carpetas

```
src/
├── app/
│   ├── (shell)/           # rutas autenticadas con header común
│   │   ├── dashboard/     # vista semanal del vendedor
│   │   ├── visits/        # CRUD de visitas del vendedor
│   │   ├── metricas/      # métricas del vendedor
│   │   └── admin/         # panel admin
│   ├── login/             # /login
│   ├── invite/[token]/    # /invite/<token>
│   ├── api/auth/          # Auth.js routes
│   ├── layout.tsx
│   └── page.tsx           # redirect según rol
├── components/            # componentes UI propios + ui/* shadcn
├── lib/
│   ├── auth.ts            # Auth.js config (Credentials provider)
│   ├── db.ts              # Prisma singleton con adapter-pg
│   ├── visits.ts          # score, transitions, base where
│   ├── metrics.ts         # queries agregadas
│   ├── invites.ts         # generación y hash de tokens
│   ├── rate-limit.ts      # bucket en memoria para /login
│   ├── tz.ts              # formateo en timezone
│   ├── zonas.ts           # zonas seedeadas
│   └── actions/           # server actions
├── proxy.ts               # gating de sesión y rol (antes middleware.ts)
└── generated/prisma/      # cliente Prisma (gitignored, se genera en postinstall)

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

scripts/
├── seed-test-visits.ts    # crea ~9 visitas de ejemplo
└── smoke-invite.ts        # genera un invite token para testing
```
