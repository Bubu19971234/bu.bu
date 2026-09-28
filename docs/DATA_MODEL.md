# Data model (Phase 0–1)

Source of truth: `supabase/migrations/*.sql`. This is a map, not a replacement.

```
auth.users ──1:1── profiles (status)
                    ├─1:1── account_private_data (exact DOB — private)
                    ├─0:1── platform_staff (admin | moderator)
                    ├─0:1── player_profiles (publishable football data)
                    │          ├── guardian_relationships ──< guardian_consents (versioned, scoped)
                    │          ├── player_clips ──1:1── media_assets
                    │          ├── ai_analysis_runs ──< ai_observations
                    │          └── player_rating_snapshots (versioned, nullable attributes)
                    ├── media_assets (owner namespace, lifecycle, verified facts)
                    ├── user_blocks / content_reports
                    └── account_deletion_requests
moderation_actions, audit_log (append-only), idempotency_keys, app_config (limits)
```

## Migrations

| File | Contents |
|---|---|
| `20260927100000_foundation.sql` | helpers, `app_config`, `profiles`, `account_private_data`, `platform_staff`, `audit_log`, `idempotency_keys` |
| `20260927100100_players_guardians.sql` | `player_profiles`, guardian relationships/consents, publication helpers, onboarding & guardian RPCs |
| `20260927100200_media_clips.sql` | `media_assets`, `player_clips`, storage bucket + policies, upload lifecycle RPCs |
| `20260927100300_trust_safety.sql` | blocks, reports, moderation actions, deletion requests, staff RPCs, playback access |
| `20260927100400_ai_public.sql` | AI runs/observations, rating snapshots, public profile read model |

## Media

- Bucket `player-media` (private, 150 MiB limit, MP4/MOV/JPEG/PNG/WebP).
- Path: `u/<owner uuid>/<kind>/<media uuid>.<ext>` — random, owner-namespaced, reserved in the DB before
  upload. Storage `INSERT` policy only accepts a path reserved by the same user in `uploading` state.
- Lifecycle: `uploading → uploaded → processing → pending_moderation → published`, or `rejected` / `failed`
  / `deleted`. Upload success never publishes.
- Verified facts (`verified_mime`, `verified_size_bytes`, `verified_duration_ms`) are written only by the
  server probe; a CHECK constraint forbids a player clip in review/published without a verified duration ≤ 60 000 ms.
- Provider abstraction: `MediaStorage` (`packages/supabase/src/server/storage.ts`). `processed_path` is
  reserved for transcoded renditions (e.g. Cloudflare Stream/Mux later).
- Large uploads: the reserved `bucket/path` can be uploaded with Supabase's TUS endpoint
  (`/storage/v1/upload/resumable`) using the same RLS; plug a TUS `Uploader` into `mediaService.upload`.

## Ratings (spec §4.2, §35)

- `ai_observations`: one row per (run, attribute); `score` nullable; `confidence` 0–1; `source_type`.
- `player_rating_snapshots`: `version` per player; attributes nullable (= insufficient data);
  `overall` only when ≥4 attributes rated and mean confidence ≥ 0.35; `attribute_details` keeps
  status/level/evidence/sources per attribute. Aggregation: `@ftn/core/rating#buildRatingSnapshot`.

## Data origins (spec §43)

Phase 1 data is either **self-declared** (profile fields) or **AI observed** (card values). The UI labels
both. `verification_status = club_verified` is reserved for Phase 2 and not settable by players.

## Deferred (schema intentionally not created yet)

Clubs/teams/memberships (Phase 2); seasons/competitions/matches/appearances/events with provenance
(Phase 3); scouting (Phase 4); subscriptions/entitlements (Phase 5). No health/injury data, ever, without a
dedicated legal design.
