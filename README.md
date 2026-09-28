# Football Talent Network (working name)

Digital football passport for Italian youth and amateur football: player identity & card, clips,
guardian-controlled publication for minors, and (later) clubs, competitions and scouting.

- Spec: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
- Plan & status: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
- Data model: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
- Security / RLS / risk register: [`docs/SECURITY.md`](docs/SECURITY.md)

## Layout

```
apps/web        Next.js 16 — public site, public player pages, guardian area, moderation, server routes
apps/mobile     Expo SDK 57 — player app
packages/core   domain rules (age, media, rating, AI contract) — no React, no Supabase
packages/validation  Zod schemas shared by clients and server
packages/supabase    typed clients + domain services; `/server` = privileged, server-only
supabase/       migrations, config, seed (fake data), DB tests (RLS, idempotency, concurrency)
```

## Getting started

Requirements: Node 22, pnpm 10, a **development** Supabase project (never production) or the Supabase CLI
local stack (`supabase start`, needs Docker).

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local       # dev URL, publishable key, service-role key (server only)
cp apps/mobile/.env.example apps/mobile/.env       # dev URL, publishable key, web base URL — no secrets
supabase link --project-ref <dev-ref> && supabase db push   # or: supabase start && supabase db reset
pnpm dev:web
pnpm dev:mobile
```

## Checks

```bash
pnpm lint
pnpm typecheck
TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres pnpm test   # needs a throwaway Postgres
pnpm build:web
pnpm check:secrets
```

The DB tests create a database named `ftn_test` on the given server, apply a small Supabase shim plus all
migrations, and run every test in a rolled-back transaction.
