<!-- Guidance for AI coding agents working in CourierManagementSystem -->

# CourierManagementSystem — Copilot Instructions

Short, actionable notes to help an AI contributor be productive immediately.

- **Big picture:** This repo contains a NestJS backend (`courier-system-backend`) and a Next.js frontend (`courier-system-frontend`). Backend is the source of truth (Postgres via Prisma). Frontend talks to backend (dev ports: frontend ~3000, backend ~3001).

- **Key components:**
  - `courier-system-backend/src` — NestJS app (module-per-domain pattern: `modules/drivers`, `modules/jobs`, plus `driver/`, `admin/`, `pricing/`, `tracking/`).
  - `courier-system-backend/prisma/schema.prisma` — database schema and enums; Prisma client is generated to `courier-system-backend/generated/prisma/client`.
  - `courier-system-frontend/` — Next.js 14 app using React 18 and Tailwind; client code under `src/app` and components in `src/components`.
  - `uploads/` (repo root under backend) — served statically in dev by the backend at `/uploads`.

- **Important runtime behavior & conventions (discoverable):**
  - `ConfigModule.forRoot()` is loaded first in `AppModule` — environment variables are relied upon globally.
  - `main.ts` enables shutdown hooks (`app.enableShutdownHooks()`), mounts a dev-only permissive CORS middleware, registers `healthRouter`, and sets a global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted`.
  - Prisma models use enums and JSON blobs; many fields are intentionally left as `Json` for flexibility.
  - Driver auth uses a `pinHash` stored on the `Driver` model; search `pinHash` or `driver-auth` to follow auth flows.

- **Common developer workflows / commands:**
  - Backend install & dev: `cd courier-system-backend && npm install && npm run start:dev` (nest live-reload).
  - Frontend install & dev: `cd courier-system-frontend && npm install && npm run dev` (Next.js on :3000).
  - Generate/run Prisma locally: from `courier-system-backend`: `npx prisma migrate dev` then `npx prisma generate`. Seed with `npx prisma db seed` (repo's seed is `prisma/seed.ts`).
  - Run backend tests: `npm test` (unit) and `npm run test:e2e` for e2e (config under `test/jest-e2e.json`).
  - Quick backend health check from frontend repo: `npm run check:backend` in `courier-system-frontend` (calls `/api/backend/health` in dev).

- **Where to look when changing behavior:**
  - Global middleware & pipes: `courier-system-backend/src/main.ts`.
  - Module wiring and DI: `courier-system-backend/src/app.module.ts` and each `modules/*/` folder.
  - DB + migrations: `courier-system-backend/prisma/*` (schema and `migrations/`).
  - File uploads & driver proof photos: `uploads/` and `driver`/`driver-proof.controller.ts`.

- **Patterns & conventions to follow when editing:**
  - Keep `ConfigModule.forRoot()` first in `AppModule` so env vars load globally.
  - Update `prisma/schema.prisma` for data model changes, then run `npx prisma migrate dev` and `npx prisma generate` (or update generated client path).
  - Respect existing ValidationPipe settings (`whitelist`, `transform`) — DTOs live under module `dto/` folders.
  - For cross-cutting errors, `common/filters/AllExceptionsFilter` is used globally.

- **Integration points & external deps:**
  - Postgres via `@prisma/client` and `pg`.
  - Auth: local pin-based driver auth plus `@nestjs/jwt` / `passport` in `driver-auth*` files.
  - Email via `@sendgrid/mail` and optional Supabase usage (`@supabase/supabase-js`).

- **Safety notes for agents:**
  - Avoid enabling permissive CORS changes for production — `main.ts` contains a DEV-only CORS middleware.
  - When editing migrations or Prisma models, be explicit about schema changes and run migrations locally — altering `schema.prisma` without running `prisma migrate` will break the generated client.

- **Files to open first when onboarding:**
  - `courier-system-backend/src/main.ts`
  - `courier-system-backend/src/app.module.ts`
  - `courier-system-backend/prisma/schema.prisma`
  - `courier-system-backend/prisma/seed.ts`
  - `courier-system-frontend/src/app/layout.tsx` and `pages/api/*` (frontend API helpers)

If anything critical above is missing or unclear, tell me which area you want expanded (DB, auth, jobs assignment, or frontend routing) and I'll iterate.
