# Implementation plan & status

Maps the master spec (`docs/MASTER_SPEC.md`) to this repository. Updated with every batch.

## 1. Repository audit (starting point, 2026-09-27)

| Item | Finding |
|---|---|
| Repository | Empty: one `README.md`, one commit (`Initial commit`). No existing code, config, or conventions to preserve. |
| Package manager | None configured. Tooling available: Node 22.22, pnpm 10.33, npm 10.9. |
| Supabase | Account has **two unrelated projects** (`AI SOM`, `check-in`, eu-west-1). **Neither was touched.** No project exists for this product yet. |
| Vercel | Team `AI-SOM - SAAS` exists. No project for this repo. **Nothing created.** |
| Docker | Available but Docker Hub is rate-limited and `public.ecr.aws` blocked from this sandbox → the Supabase local stack could not start here. |

Consequence: no conflicts with existing infrastructure. Database work was validated on a plain
Postgres 16 with a minimal Supabase shim (`supabase/tests/shim/supabase_shim.sql`: roles, `auth.uid()`,
`auth.users`, `storage.buckets/objects`, Supabase default grants). CI runs the same suite on Postgres 17.

## 2. Framework / package versions

| Area | Version |
|---|---|
| Monorepo | pnpm workspaces (`node-linker=hoisted` for Metro) |
| TypeScript | 6.0.x (TS 7 is out, but `typescript-eslint` supports `<6.1`) |
| Web | Next.js 16.3.6 (App Router, Turbopack), React 19.2.3 |
| Mobile | Expo SDK 57, React Native 0.86.3, Expo Router 57, React 19.2.3 (pinned to Expo's version so both apps share one React) |
| Supabase | `@supabase/supabase-js` 2.117, `@supabase/ssr` 0.12 |
| Validation | Zod 4 |
| Tests | Vitest 4, `pg` for DB tests |
| Lint | ESLint 9 flat config, `typescript-eslint` 8, `eslint-config-next` 16, `react-hooks` 7 |

## 3. Supabase / Vercel integration state — ACTION REQUIRED

Nothing remote was created or modified. To go live in **dev**:

1. Create a **new** Supabase project (dev), e.g. `ftn-dev`, region eu (Frankfurt/Ireland). Later a separate `ftn-prod`.
2. `supabase link --project-ref <dev-ref>` then `supabase db push` (applies `supabase/migrations/*`).
   Review the SQL first — spec §37.
3. Copy the dev URL + publishable key into `apps/web/.env.local` and `apps/mobile/.env`, service-role key
   into `apps/web/.env.local` **only**.
4. Create a Vercel project from this repo with root `apps/web`; add env vars per environment
   (Preview → dev Supabase, Production → prod Supabase). Never give Preview the prod service key.
5. Promote a moderator: `insert into public.platform_staff (user_id, role) values ('<uuid>', 'admin');`

Creating paid resources was deliberately left to the owner.

## 4. Gaps / conflicts with the spec (and decisions taken)

| Spec | Decision | Why |
|---|---|---|
| §13 `player_private_data` | Implemented as `account_private_data` (keyed by user) | Guardians also need a private DOB for the adult check; one table avoids duplicating sensitive data. |
| §22 `packages/types`, `packages/ui` | Not created | Types live in `@ftn/supabase` (DB) and `@ftn/core` (domain). UI sharing between RN and web is not yet useful. Spec says "only if genuinely useful". |
| §5.1 client-side compression | iOS: system picker exports 1280×720 (`IFrame1280x720`) with built-in trim UI | No extra native dependency. Android compression is a Phase 6 item. |
| §5.3 TUS resumable upload | Upload path uses an `Uploader` abstraction; Phase 1 ships the standard upload | TUS client wiring needs a device test; the storage policy/path model already supports it. |
| §5.1 server duration validation | Server probes MP4/MOV `moov/mvhd` via HTTP range reads (never proxies the video) | Pure TS, no ffmpeg in serverless. Other containers are rejected. |
| §4.1 photo step before profile | Photo is the last wizard step (after the profile exists) | Uploads are namespaced by owner and require a player profile. |
| §16.1 login | Email + password (Supabase Auth) | Sign in with Apple deferred until any social login is added (Phase 6). |
| §8 guardian verification | `verification_state = email_matched` (guardian's confirmed login email = invited email, adult DOB) | Not identity verification; see SECURITY.md risk A. |
| Generated DB types | Hand-maintained `packages/supabase/src/database.types.ts` | CLI type generation needs the Docker stack; switch to `supabase gen types` once the dev project exists. |

## 5. Phase 0 — Foundation ✅

- pnpm monorepo: `apps/web`, `apps/mobile`, `packages/{core,validation,supabase}`, `supabase/{migrations,tests}`.
- Env separation: `apps/web/.env.example`, `apps/mobile/.env.example` (public-only), server env validated with Zod.
- Migration workflow: timestamped SQL in `supabase/migrations`, `supabase/config.toml`, fake-data `supabase/seed.sql`.
- Typed clients: `createPublicClient` (refuses service keys), `createServiceClient`/`createUserClient` (server-only guard).
- Auth skeleton: signup/login (mobile + web), auth callback, profile row trigger on `auth.users`.
- RLS baseline + explicit grants; tests assert RLS on every table and an allow-list of anon-executable functions.
- CI: lint, typecheck, unit + DB tests (Postgres service), web build, client-secret scan.

## 6. Phase 1 — Player MVP ✅ (code complete; needs a real Supabase project for end-to-end)

| Deliverable | Where |
|---|---|
| Onboarding wizard, age gate (≥13, DB-enforced) | `apps/mobile/src/app/onboarding/*`, `player_onboard()` |
| Guardian-required state 13–17, invite, accept, revoke, re-grant | `guardian.tsx`, web `/guardian/*`, `guardian_*()` |
| Player profile, gaming card, progression, missions | `(tabs)/home.tsx`, `components/PlayerCard.tsx`, `@ftn/core/profile` |
| Photo upload | `components/PhotoPicker.tsx` |
| Public/private separation | `player_profiles` vs `account_private_data` vs `guardian_*`; `get_public_player_profile()` whitelist |
| Clip upload ≤60 s + category + identification note | `clips/upload.tsx`, `media_*()`, CHECK constraint |
| AI schema + mocked pipeline with provenance | `ai_*` tables, `MockClipAnalyzer`, `runClipAnalysis()` |
| Public player page | web `/p/[slug]` |
| Privacy controls | `(tabs)/settings.tsx` |
| Report/block | `report.tsx`, web `ReportBlock`, `report_content()`, `block_player()` |
| Account deletion request + processing | `delete-account.tsx`, `account_request_deletion()`, admin `/admin` |
| Minimal moderation screen | web `/admin` |

Exit criteria status:

| Criterion | Status |
|---|---|
| Minor cannot publish without guardian approval | Enforced in DB, tested |
| 60-second rule | Client + server probe + DB constraint, tested |
| Public profile has no private/guardian data | Whitelist function, tested |
| Retries don't duplicate | client_operation_id / unique keys / idempotency keys, tested (incl. real concurrent connections) |
| 20–50 testers onboard without admin | **Not yet verifiable** — requires the dev Supabase project + TestFlight/Expo Go build |

## 7. Commands

```bash
pnpm install
pnpm lint && pnpm typecheck
TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres pnpm test   # unit + DB tests
pnpm build:web && pnpm check:secrets
pnpm dev:web            # http://localhost:3000
pnpm dev:mobile         # Expo
```

## 8. Next (not started — Phase 2 requires explicit go-ahead)

- Wire real email provider for guardian invites (Resend/Postmark) behind `Mailer`.
- TUS uploader on mobile; Android compression.
- Replace hand-written DB types with generated ones in CI.
- Phase 2: clubs, memberships, invitations, team scopes, verification, audit.
