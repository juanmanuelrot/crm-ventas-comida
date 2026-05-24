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

**Opciones para `DATABASE_URL`:**

- **Neon (recomendado, free tier permanente)**: crear un proyecto en [neon.tech](https://neon.tech) y copiar la connection string.
- **Supabase**: crear proyecto, ir a *Settings → Database → Connection string (Direct)*.
- **Prisma Postgres temporal (solo para probar)**:
  ```bash
  npx create-db create --ttl 24h --env .env.local
  ```
  La base expira en 24h, no usar en producción.

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

El archivo [`.do/app.yaml`](./.do/app.yaml) contiene el spec de DO App Platform. Define:

- **Servicio `web`**: corre `npm run build` y `npm start`. Lee `PORT` del entorno DO.
- **Job `migrate-db`** (pre-deploy): corre `prisma migrate deploy` antes de cada deploy.

### Setup paso a paso

1. **Crear una base de datos Postgres** (Neon free tier).
   - Crear proyecto en [neon.tech](https://neon.tech).
   - Copiar el connection string (con `sslmode=require`).

2. **Conectar el repo a DigitalOcean Apps**.
   - Ir a [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps).
   - "Create App" → GitHub → seleccionar `juanmanuelrot/crm-ventas-comida`, branch `main`.
   - DO detecta el `.do/app.yaml` automáticamente. Si no, elegí "Import App Spec from Source" y apuntá a ese archivo.

3. **Configurar las variables de entorno** (en el dashboard de DO, sección *Settings → App-Level Environment Variables*):
   - `DATABASE_URL` — connection string de Neon
   - `AUTH_SECRET` — generar con `openssl rand -hex 32`
   - `ADMIN_PASSWORD` — password del admin
   - Las demás (`ADMIN_EMAIL`, `ADMIN_NAME`, `TIMEZONE`, `AUTH_TRUST_HOST`) ya vienen seteadas en el spec.

   Las que tienen `type: SECRET` se setean en el dashboard de DO y se guardan cifradas.

4. **Deploy**: DO arranca el primer deploy. El job `migrate-db` corre primero (aplica las migraciones), después el servicio `web`.

5. **Seedear el admin** (solo la primera vez):
   - Ir al panel de DO → tu app → *Console* (consola del servicio web).
   - Correr: `npm run db:seed`
   - Esto crea el usuario admin con el `ADMIN_EMAIL`/`ADMIN_PASSWORD` que configuraste.
   - Alternativamente, podés correr el seed localmente apuntando al `DATABASE_URL` de producción.

6. **Listo**: la app queda disponible en la URL que DO te asigna (algo tipo `https://crm-ventas-comida-xxxx.ondigitalocean.app`).

### Notas de deploy

- **`postinstall: prisma generate`** genera el cliente Prisma automáticamente después de cada `npm install`, tanto local como en DO.
- **`AUTH_TRUST_HOST=true`** está hardcodeado en el spec porque Auth.js necesita confiar en el header `Host` cuando corre detrás del proxy de DO.
- **JWT sessions**: la sesión vive en una cookie firmada con `AUTH_SECRET`. No requiere tabla en la DB.
- **Migraciones**: cada `git push` a `main` dispara un nuevo deploy. El job `migrate-db` aplica las migraciones pendientes antes de que el servicio web reciba tráfico.
- **Re-seeding**: el seed usa `upsert`, no rompe nada si lo corrés varias veces.
- **Custom domain**: lo configurás desde el dashboard de DO (*Settings → Domains*).

### Tamaño/costo

Con `basic-xxs` (512 MB RAM, 1 vCPU compartida) la app corre cómoda para uso de un negocio chico. La base en Neon free tier alcanza para varios miles de visitas.

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
