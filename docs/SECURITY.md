# Security, privacy & RLS

## Principles (spec §16–§18, §29)

1. **Authorization lives in the database.** Every `public` table has RLS; grants are explicit (Supabase's
   default "grant all to anon/authenticated" is revoked per table). UI checks are presentation only.
2. **Privileged writes go through `SECURITY DEFINER` functions** with `search_path = ''` and fully
   qualified names. Clients cannot `INSERT` into any table directly.
3. **Protected columns are not granted.** Players may `UPDATE` only whitelisted columns of their own
   profile/clips (column-level `GRANT UPDATE (...)`). `verification_status`, `moderation_status`,
   `user_id`, `slug`, `version`, and all guardian/consent/media-status data are unreachable.
4. **Public reads use a whitelist function** (`get_public_player_profile`), not table access. Anon cannot
   select any player table.
5. **The service-role key is server-only**: `@ftn/supabase/server` throws if imported in a browser/RN
   runtime; `createPublicClient` refuses secret/service keys; `pnpm check:secrets` scans client source and
   built bundles (Next.js chunks, Expo export).
6. **Nothing client-supplied is trusted** for permissions, media duration/MIME/size, age, guardian state,
   ownership or verification.

## Role matrix (Phase 1)

| Data | anon | player (own) | guardian (linked, active) | staff | service role |
|---|---|---|---|---|---|
| `player_profiles` | ✗ (only via whitelist fn when public) | read, update whitelisted cols | read | read | all |
| `account_private_data` (DOB) | ✗ | read | ✗ | ✗ | all |
| `guardian_relationships` | ✗ | read (no token hash) | read | read | all |
| `guardian_consents` | ✗ | read | read | read | all |
| `media_assets` | ✗ | read | ✗ | read | all |
| `player_clips` | ✗ | read, update whitelisted cols | read | read | all |
| `ai_*`, `player_rating_snapshots` | ✗ | read | read | read | write via fns |
| `content_reports` | ✗ | own (limited cols) | own | all | all |
| `audit_log` | ✗ | ✗ | ✗ | admin read | append |

Staff = row in `platform_staff` (never self-assignable, managed via SQL/service role).

## Effective publication

`player_is_public(p)` = visibility `public` ∧ not deleted ∧ not moderation-hidden ∧ account `active` ∧
(adult ∨ active guardian consent with scope `public_profile`). Clips additionally need media `published`
(moderated), clip visibility `public`, and for minors the `public_clips` scope. AI card values on public
pages need the `ai_analysis` scope for minors. Blocks hide profiles/media both ways.

Public pages are cached for ≤60 s (`revalidate = 60`), so a revocation can take up to a minute to disappear
from the CDN copy. Media URLs are signed and short-lived (default 300 s; avatars on public pages 1 h).

## Guardian flow

1. Minor requests an invite (`POST /api/guardian/requests`) → row created *as the minor* (DB checks age,
   rate limit 5/day, not own email) → token issued with the service role, **only its SHA-256 is stored**,
   plaintext goes to the guardian's email in the URL fragment (not logged by servers). The minor's device
   never receives it.
2. Guardian signs in with the **invited, confirmed** email, declares an adult DOB, accepts versioned scopes.
3. Consent rows are versioned and never deleted by product flows; revocation sets `revoked_at`.

## Idempotency & concurrency (spec §15)

- `client_operation_id` unique per owner: `media_assets`, `content_reports`.
- One logical record per natural key: `player_profiles.user_id`, `player_clips.media_id`, one pending invite
  per (player, email), one active consent per relationship, one open deletion request per user,
  `ai_analysis_runs.idempotency_key`, `(player, version)` for snapshots.
- HTTP `Idempotency-Key` stored in `idempotency_keys` (actor + action + key, request hash, replay/mismatch/in-progress).
- Per-player `SELECT … FOR UPDATE` serializes limit checks (clip count, invites) and snapshot versioning.
- Optimistic concurrency: `version` column bumped by trigger; services update with `.eq('version', v)` and
  surface `version_conflict` instead of overwriting.

## Account deletion workflow (spec §30)

1. In-app request → `account_request_deletion()` (idempotent) sets account `deletion_requested`: profile,
   clips and media become non-public immediately.
2. Admin/job runs `/admin → Esegui cancellazione`:
   `account_process_deletion()` deletes `account_private_data`, anonymizes the football profile
   (`user_id = null`, generic name/slug, optional fields cleared), soft-deletes media and clips, revokes
   guardian links/consents, removes blocks; then storage objects are removed and the auth user is deleted.
3. Retained (justified, to be confirmed by legal policy): audit log, moderation actions, reports, consent
   history rows, anonymized football facts. No promise of "everything disappears immediately".

## Legal / privacy risk register (spec §31) — status

| Risk | Phase 1 mitigation | Open |
|---|---|---|
| **A. Minors** (13–17 public profiles/videos) | Guardian consent required for any publication; minimization (birth year only, no contact data); no DMs/comments; public pages `noindex`; moderation before publication | Guardian identity is **email-matched, not verified**: a minor controlling a second adult-declared email can self-approve. Needs stronger verification (e.g. document/payment micro-auth or club confirmation) before scale. |
| **B. AI scoring used in recruitment** | Mock provider only; scores capped in confidence; `insufficient_data` instead of low scores; provenance per run; no scout ranking exists | AI Act classification before any scout-facing AI. |
| **C. Health data** | Not collected at all | — |
| **D. Data ingestion / database rights** | No ingestion in Phase 1 | Source review in Phase 3. |
| **E. UGC / App Store** | Report, block, moderation queue, support page, in-app deletion, legal pages (drafts) | Legal texts are drafts; support email is a placeholder. |
| **F. App Store billing** | No billing | — |

## Known limitations (honest list)

- DB tests run on vanilla Postgres + shim; real Supabase Storage/Auth behaviour (e.g. storage RLS with TUS,
  email confirmation) has **not** been exercised end-to-end yet.
- Rate limits are per-user DB limits; there is no IP/bot protection on signup yet (Supabase Auth defaults only).
- The dev mailer prints invite links to server logs — must be replaced before any real minor uses the product.
- Deleted media objects are removed only by the deletion workflow; a periodic cleanup job for
  `status = 'deleted'` media is still to do.
