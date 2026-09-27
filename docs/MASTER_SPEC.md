# Football Talent Network — Master Build Spec v0.1

> **Purpose of this file:** technical/product source of truth given to Claude Code before implementation.
> **Status:** prototype/MVP architecture — designed to be evolvable, not over-engineered.
> **Working name:** `Football Talent Network` (placeholder; branding to be decided later).

---

## 0. Instructions for Claude Code

You are implementing a new product from this specification.

### Non-negotiable operating rules

1. Inspect the existing repository before changing anything. Report the current structure, package manager, framework versions, existing Supabase/Vercel configuration, and conflicts with this spec.
2. Do not rewrite working infrastructure without a concrete reason. Adapt the plan to the existing repository when possible.
3. Do not make destructive changes to production Supabase. Database changes must be migration-based and committed to Git.
4. Never expose `SUPABASE_SERVICE_ROLE_KEY`, database passwords, payment secrets, AI keys, or admin credentials to client code.
5. Use a development Supabase project for implementation and testing. Production must be isolated.
6. Implement incrementally. Do not attempt the entire product in one pass.
7. After every implementation batch, run at minimum: typecheck; lint; relevant tests; build for affected app(s).
8. RLS is mandatory for any Supabase table exposed via the Data API.
9. Authorization must not exist only in UI code. Database/server enforcement is mandatory.
10. Do not trust data supplied by the client for permissions, media duration, subscription status, ownership, club membership, age/guardian state, or verification state.
11. Every important mutation must be safe against retries/concurrency through unique constraints, transactions, idempotency keys, or atomic database operations.
12. When uncertain about a destructive or irreversible architectural decision, prefer the option that keeps data portable and components replaceable.
13. Do not implement real billing, automatic external-data scraping, public health/injury data, or AI-based scout ranking in Phase 1. Their schemas may be prepared, but functionality is deferred.

### First execution task

Before writing application features:

1. Audit repository and dependencies.
2. Produce `IMPLEMENTATION_PLAN.md` mapping the existing repo to this spec.
3. Create/confirm dev environment and `.env.example` files.
4. Create the database migration foundation.
5. Implement only Phase 0 and Phase 1 unless explicitly instructed to continue.

---

## 1. Product vision

Build a football network focused initially on Italian youth and amateur football, combining:

- a social/player identity experience;
- football-career history and structured statistics;
- club/team management and verification;
- public championships, fixtures, results and standings;
- video clips;
- AI-assisted player analysis/gamification;
- professional scouting tools.

The product should feel like a career game for the player, but remain credible and structured enough to become a real scouting database.

Core concept:

> Every player builds a digital football passport.
> Every club documents and verifies the talent it develops.
> Scouts reduce the cost of discovering who is worth watching live.

---

## 2. Business model assumptions

These prices are product assumptions, not Phase 1 billing implementation requirements.

| Actor | Planned price | Core value |
|---|---:|---|
| Player | Free | Profile, card, clips, career, visibility |
| Club | €299/year | Whole club workspace, all teams, unlimited staff accounts, data verification |
| Scout Pro | €999/year | Professional search, shortlist, notes, comparisons |
| Scouting Department / Enterprise | From €5,000/year | Multi-user workspace, shared scouting, reporting, integrations |

Important commercial principle:

- players create supply and should remain free;
- clubs enrich/verify the graph at a low annual cost;
- scouts and professional departments pay for discovery/productivity.

Do not create a paid player feature that can be interpreted as "pay to be seen by scouts" in the MVP.

---

## 3. User types

### 3.1 Public visitor — no login

Can view, subject to privacy settings: competitions; seasons; groups; fixtures; results; standings; public club pages; public team pages; player public profile where publication is permitted; public clips approved for publication.

Must not see: private email/phone; precise home address/location; guardian identity/contact details; private health information; private scout notes; staff internal notes; moderation information; unpublished clips.

### 3.2 Player

Minimum product age: 13 years.

Can: create football profile; create gaming-style player card; enter preferred role, secondary roles, dominant foot, height, club/team relationship; upload profile photo; upload short player clips; receive AI-assisted observations/card updates; connect to a club/team/season; see career timeline; request/receive club verification; control allowed public profile fields; report/block users/content; request account deletion.

### 3.3 Guardian

Separate user account — never share the player password.

Product policy:

- every player aged 13–17 requires a guardian approval workflow before the player profile becomes publicly publishable;
- guardian consent records must be versioned and auditable;
- guardian can revoke publication permissions, subject to legal/product retention rules;
- guardian is the contact route for restricted interactions involving minors when required.

This is intentionally more conservative than the minimum Italian "digital consent" age rule.

### 3.4 Club

A club is an organization/workspace, not a shared username/password.

Club subscription should permit: unlimited teams; unlimited staff/member accounts; role-based permissions; concurrent access; team rosters; player verification; match/stat updates; club media; longer club video than player clips; audit log.

### 3.5 Club member roles

Initial role set: OWNER, ADMIN, DIRECTOR, COACH, TEAM_MANAGER, CONTENT_MANAGER, VIEWER.

Permissions must be data-driven and enforced server/database side. Support optional team scope so a coach can be limited to U17 while an owner sees the whole club.

### 3.6 Scout Pro

Later phase. Can eventually: search players by structured criteria; maintain private shortlist; maintain private notes; compare players; receive alerts; see richer verified data than anonymous visitors where legally/product permitted.

### 3.7 Scouting organization / Enterprise

Later phase. Adds: multiple scout accounts; shared shortlists; internal notes; territories; organization audit trail; reporting/export; later API/integrations.

### 3.8 Platform administrator/moderator

Internal role only. Can: review reports; moderate media/content; verify/revoke professional accounts; review disputed data; inspect audit logs according to least privilege; suspend accounts/clubs; manage import/source errors.

---

## 4. Player UX direction

The player-side UI must feel much closer to a football career game than to LinkedIn.

Do not copy protected EA FC / Football Manager branding, artwork, card designs, icons, terminology combinations, or assets. Build an original visual identity.

### 4.1 Player onboarding

Desired feeling: "Create your footballer". Steps:

1. account;
2. date of birth / age validation;
3. guardian flow if 13–17;
4. photo;
5. display name;
6. birth year (public); exact DOB remains private;
7. height;
8. dominant foot;
9. preferred role;
10. secondary role(s);
11. current club/team or "not currently linked";
12. shirt number optional;
13. profile visibility review;
14. initial player card.

### 4.2 Card attributes

Possible presentation: PAC — pace; SHO — shooting; PAS — passing; DRI — dribbling; DEF — defending; PHY — physical.

These are gamification indicators, not certified objective measurements unless underlying evidence justifies it.

Each attribute must support: value; confidence/evidence level; source breakdown; insufficient_data state.

Never convert "not seen in clips" into "player is bad at it".

Example: Pace: 74 — medium confidence; Shooting: 68 — low confidence; Defending: insufficient data.

### 4.3 Player progression

Players should see: current card; previous card/version; changes over time; season stats; club verification status; evidence completeness; suggested profile-completion tasks.

Examples of safe "missions": add profile photo; connect current club; get club verified; add a defensive clip; add a passing clip; complete role information.

Avoid manipulative engagement patterns.

---

## 5. Video/media model

### 5.1 Player clips

Hard product rule: **maximum 60 seconds per player clip.**

Prototype defaults: configurable maximum file size; client-side trimming before upload; client-side compression target around 720p; server must still validate MIME, size and duration after upload/processing; maximum active player clip count should be configurable (initial suggestion: 6–8).

Suggested clip categories: dribbling / 1v1; shooting / finishing; passing / vision; build-up; defensive action; speed / athletic action; set piece; goalkeeper; other.

The player must be able to indicate which person they are in a clip where identification is ambiguous.

### 5.2 Club video

Club accounts may upload longer media than players. Do not hard-code the final commercial limit yet. Use configurable limits by plan. For prototype, use a conservative default and make it an environment/config value.

### 5.3 Storage strategy — MVP

Use Supabase Storage initially. Requirements:

- direct client-to-storage upload;
- use resumable/TUS upload for larger media;
- never proxy large video bytes through Vercel Functions;
- media path must include owner/organization namespace and random UUID;
- original upload and processed/public asset must be distinguishable;
- store metadata in Postgres rather than deriving business state only from filenames;
- support future migration to Cloudflare Stream/R2, Mux, S3, etc.

Design media access behind a service/repository abstraction so storage provider can be replaced later.

### 5.4 Media lifecycle

Recommended statuses: uploading; uploaded; processing; pending_moderation; published; rejected; failed; deleted.

Do not publish immediately solely because upload succeeded.

---

## 6. AI model principles

### 6.1 MVP AI purpose

AI is initially for: player-facing gamification; structured observations; evidence categorization; summarizing clip content; identifying missing evidence; generating explainable profile updates.

AI must not initially be the authoritative ranking engine for scouts.

### 6.2 Critical rule: no fake precision

Never present a generated number as a measured fact if it is inferred from selected highlight clips.

Every analysis should retain: model/provider; model version; prompt/schema version; media inputs used; timestamp; confidence; analysis status; structured evidence; human/club verification where applicable.

Example output model:

```json
{
  "attribute": "dribbling",
  "score": 73,
  "confidence": 0.61,
  "evidence_count": 6,
  "source_type": "player_selected_clips",
  "limitations": ["selected highlights", "no full-match context"]
}
```

### 6.3 AI + scouting legal boundary

Do not implement "AI says these are the best players" or automatic ranking/filtering that materially decides who a professional club should recruit until a specific EU/Italian legal assessment is completed.

Reason: EU AI Act Annex III treats certain AI systems used to recruit/select/evaluate people in employment contexts as high-risk. It is not assumed here that football scouting automatically falls within that definition, but professional-player recruitment could create regulatory exposure.

MVP scout search should therefore prioritize objective filters, e.g.: birth year; role; club; competition; appearances; minutes; goals; assists; dominant foot; location at broad club/competition level; verified/unverified status; number of available clips.

AI observations can be displayed as supporting information but must not silently become a hiring/recruitment decision engine.

---

## 7. Health/injury data

An injury is health information and must be treated as sensitive data. Do not implement public injury status in Phase 1.

If added later: separate table/schema from ordinary player profile; private by default; explicit lawful basis/consent process; granular sharing controls; no inference of medical diagnosis by AI; no public search/filter by medical condition; specific legal/privacy review before production.

For MVP, omit injury data completely.

---

## 8. Minors and guardian model

### 8.1 Product rule

- minimum player age: 13;
- age 13–17: guardian approval required by platform policy before public publication;
- 18+: autonomous account.

### 8.2 Public profile minimization for minors

Public minor profiles should not expose by default: exact date of birth; phone; personal email; home address; precise live location; school unless a specific justified feature exists; guardian identity/contact details; health/injury information.

Prefer: birth year; football club/team; football competition; role; player-approved football media; verified football statistics.

### 8.3 Guardian consent record

Consent must be versioned, not a single boolean. Store at least: guardian user ID; player user/profile ID; relationship type; verification state; consent version; terms/privacy version; granted timestamp; revoked timestamp; IP/user-agent if legally justified and documented; scopes granted.

Do not delete the audit fact merely because the current consent is revoked; retention must follow legal policy.

---

## 9. Messaging/contact safety

Do not build open anonymous DMs in MVP.

Future professional contact model: only verified clubs/scouts can initiate formal contact requests; minor contact requests route through guardian/control flow; block/report available; audit trail; rate limits; no public personal contact details.

---

## 10. Public football data: competitions, results and standings

Public championship information is an important acquisition surface and should be visible without login.

### 10.1 Data hierarchy

Never model a result only as free text.

```
Season
  Competition
    Region/territory if relevant
      Group
        Matchday
          Match
```

A match includes at least: season; competition; group; matchday; home team; away team; scheduled date/time; status; final score; administrative score/decision where relevant; source/provenance; last verified time.

Possible statuses: scheduled; live/manual updating; finished; postponed; suspended; cancelled; awarded/admin decision.

### 10.2 Source provenance

Every imported fact should support: source_type; source_name; source_url; external_id if available; observed_at; effective_at; raw_hash / source version where useful; import job ID; verification status.

### 10.3 Do not indiscriminately scrape third-party result databases

Public accessibility does not automatically mean unrestricted commercial reuse. Before automating a source, verify: terms of use; robots/access restrictions where applicable; API/feed availability; copyright/database-right issues; personal-data implications.

For MVP: manually seed/pilot a limited set of competitions; prioritize official/open/permitted sources; build the import architecture separately from the source-specific parser. A source adapter must be replaceable.

---

## 11. Club workspace

### 11.1 Organization model

```
Club
 ├─ teams
 │   ├─ First Team
 │   ├─ U19
 │   ├─ U17
 │   └─ ...
 └─ memberships
     ├─ Owner
     ├─ Admin
     ├─ Coach
     ├─ Team manager
     ├─ Content manager
     └─ Viewer
```

No shared credentials.

### 11.2 Unlimited staff accounts

Product goal: subscription is per club, not per staff seat. This is strategically useful because more club users create fresher platform data.

Architecture must still support: invitations; membership status; role; optional team scope; revocation; last activity; audit trail.

### 11.3 Verification

A club can verify: player currently in roster; team membership; shirt number; season; appearances/minutes; match events/statistics; club-generated media.

Do not let the club silently overwrite historical player career records. Membership history must be appendable/versioned.

---

## 12. Match/statistics model

Do not use mutable aggregate counters as the sole source of truth.

Bad: `player.goals = 7`, `player.assists = 5`.

Preferred: match; appearance; minutes; event(s): goal, assist, card, substitution etc.; derived season aggregates.

```
Match #123
  Appearance: Player A, 78 minutes
  Event: 63' goal, Player A
  Event: 63' assist, Player B
```

Then derive: appearances; starts; minutes; goals; assists; cards.

Aggregates may be cached/materialized for performance but must remain rebuildable from authoritative records.

---

## 13. Proposed database entities

Use UUID primary keys unless there is a compelling existing-project convention.

- **Identity / privacy:** profiles, player_profiles, player_private_data, guardian_relationships, guardian_consents
- **Clubs / permissions:** clubs, club_memberships, club_invitations, teams, team_staff_scopes
- **Football structure:** seasons, competitions, competition_groups, competition_team_entries, matchdays, matches, player_team_memberships, match_appearances, match_events, player_season_stats (derived/cache only)
- **Media / AI:** media_assets, player_clips, clip_tags, ai_analysis_runs, ai_observations, player_rating_snapshots
- **Moderation / trust:** content_reports, user_blocks, moderation_actions, verification_requests, audit_log
- **Data imports:** data_sources, import_jobs, source_records, external_entity_links
- **Commercial — later:** subscriptions, entitlements, billing_customers
- **Reliability:** idempotency_keys

Do not add every table in one migration if Phase 1 does not need it. Create foundations and expand with migrations.

---

## 14. Critical constraints and indexes

At minimum plan for:

- unique player profile per user;
- unique active membership for user+club where appropriate;
- unique team entry per competition group/season as appropriate;
- unique player-team membership scope where business rules require it;
- unique client_operation_id for write records that may be retried;
- indexes on every FK used heavily by RLS or filtering;
- indexes on club_id, team_id, player_id, season_id, competition_id, group_id, match_id;
- indexes for publication status and created/updated times;
- cursor-based pagination indexes for feeds/search.

RLS membership checks must not depend on unindexed columns.

---

## 15. Idempotency and concurrent writes

This is a core architecture requirement.

### 15.1 HTTP mutations

For important POST actions accept/generate an Idempotency-Key. Store: key; actor user ID; endpoint/action; request hash; result/reference; status; created/expiry time. Unique constraint should prevent processing the same operation twice.

### 15.2 Client operation IDs

For offline/retry-prone writes, send client_operation_id generated on device. Example `match_events.client_operation_id UNIQUE`.

### 15.3 Concurrent editing

For mutable records that can be edited simultaneously: prefer atomic SQL operations; use transactions for multi-table invariants; use optimistic concurrency via version or expected updated_at where overwrites matter; return conflict state instead of silently overwriting.

### 15.4 Audit

Club/admin changes to verified data should create audit entries containing: actor; action; entity; before/after where appropriate; timestamp; organization context.

---

## 16. Authentication and authorization

### 16.1 Auth provider

Use Supabase Auth for MVP. Initial login options: email/password or magic link depending UX decision; Sign in with Apple before App Store release if third-party social login is introduced and Apple rules require equivalent login.

### 16.2 Authorization

Authorization belongs in: 1. RLS/database; 2. privileged server actions/API; 3. UI only as presentation layer. Do not rely on hidden buttons.

### 16.3 Service role

`SUPABASE_SERVICE_ROLE_KEY`: server-only; never in Expo public env; never in browser bundle; never committed to Git; only used for tightly controlled privileged operations.

### 16.4 Permissions and JWT staleness

Prefer database membership tables as the source of truth for fine-grained club/team permissions rather than putting all mutable authorization state into long-lived JWT claims.

---

## 17. RLS strategy

RLS must be enabled on exposed tables. General pattern:

- **Public football data:** anonymous read allowed only for explicitly public rows/columns.
- **Player:** player can modify own player data but cannot self-set: verified status; club verification; paid entitlement; professional scout status; moderation status.
- **Guardian:** can access only linked minor-control data permitted by relationship and consent rules.
- **Club:** membership-based access. Example concept:

```sql
exists (
  select 1
  from club_memberships cm
  where cm.club_id = target.club_id
    and cm.user_id = auth.uid()
    and cm.status = 'active'
)
```

Optimize membership columns with indexes.

- **Sensitive data:** separate from public tables where practical. Avoid giant public tables that contain both publishable and sensitive columns.

---

## 18. Public/private data separation

Prefer architectural separation over "remember to omit this field". Example:

- `player_profiles`: display name; birth year; football attributes; role; public club relationship; visibility.
- `player_private_data`: exact DOB; personal contact information; privacy metadata.
- `guardian_*`: guardian links/consent.

Health data, if ever introduced, must be separate again. Public API/views should expose explicit whitelists of fields.

---

## 19. App Store / UGC requirements

Before App Store production submission, product must have: content reporting; moderation/filtering workflow; block user capability; published support/contact information; account deletion initiated inside the app; privacy policy; terms of service; appropriate minor safeguards; clear AI labeling where applicable; reviewer-access/test account strategy.

Do not wait until final week to add moderation/account deletion.

---

## 20. Billing architecture — deferred

Prepare entitlement abstraction but do not implement real payments in Phase 1.

Reason: B2B club/enterprise purchases and individual Scout Pro subscriptions can fall under different App Store payment rules; Club/Enterprise should be modeled as organization entitlements purchased on the web when legally/store-policy appropriate; Scout Individual requires specific App Store billing review before launch.

Client code should check entitlements, not hard-code `if plan == ...` throughout the app.

```
subscription
  owner_type: club | user | organization
  owner_id
  plan_code
  status
  starts_at
  ends_at

entitlement
  feature_code
  limit/value
```

---

## 21. Architecture

### 21.1 Recommended MVP stack

- **Mobile:** Expo; React Native; TypeScript; Expo Router; EAS Build / EAS Submit.
- **Public website + club/admin web:** Next.js App Router; TypeScript; deployed on Vercel.
- **Backend/data:** Supabase Postgres; Supabase Auth; Supabase Storage; Supabase RLS; Supabase Realtime selectively.
- **Privileged/server logic:** prefer Vercel server-side routes/actions for: AI calls; privileged workflows; webhooks; future billing; moderation admin operations; import orchestration.

Do not split business logic randomly between five server platforms. Keep a clear service layer.

---

## 22. Repository structure

Prefer one repository with pnpm workspaces.

```
/apps
  /mobile        # Expo React Native
  /web           # Next.js public + club/admin web

/packages
  /core          # domain rules/use-cases; no React dependency
  /types         # shared TS types where truly shared
  /validation    # Zod schemas/shared validation
  /supabase      # typed client helpers/repositories (not secrets)
  /ui            # only if sharing is genuinely useful

/supabase
  /migrations
  /seed
  /tests

/docs
  MASTER_SPEC.md
  IMPLEMENTATION_PLAN.md
  DATA_MODEL.md
  SECURITY.md

.env.example
```

Avoid premature monorepo complexity beyond basic workspaces.

---

## 23. Service abstraction

Do not scatter raw Supabase queries throughout UI components. Prefer domain-facing modules such as: playerService, clubService, competitionService, matchService, mediaService, aiService, moderationService, scoutingService.

Example UI call: `await playerService.getPublicProfile(playerId)` — not repeated raw table queries in many components. This makes future migration away from Supabase components possible.

---

## 24. Serverless/Postgres connection rules

For direct server-side Postgres use from Vercel/serverless: use Supabase transaction pooler/serverless-recommended method; keep connection pool tiny; avoid creating a new DB pool for every request; do not use direct persistent-connection assumptions in serverless; prefer Supabase Data API where it fits and RLS should apply.

Do not make database scaling depend on thousands of direct Postgres connections.

---

## 25. Realtime strategy

Do not make the whole app one permanent realtime subscription. Use Realtime only where it creates clear product value, e.g.: a specific live match admin screen; a club dashboard currently being edited; possibly specific notification-like updates.

Do not require every user scrolling the public app to hold a websocket subscription. Public results/feed should primarily use: cached HTTP reads; CDN/Vercel caching where appropriate; revalidation; pagination.

This allows 10k concurrent app users without requiring 10k Realtime connections.

---

## 26. Performance/scaling rules

Design target: architecture should not need a rewrite if the product becomes popular. This does not mean paying for 10k concurrent capacity on day one.

Rules: cursor pagination, not unbounded lists; no `select *` in hot paths; indexes from real query patterns; cache public data; media delivered from object storage/CDN, never application server; AI/background processing asynchronous; avoid N+1 queries; precompute/materialize expensive aggregate stats where needed; search initially in Postgres; extract to dedicated search provider later if warranted; load test read-heavy hot paths before viral/public marketing.

---

## 27. Search strategy

**MVP:** use Postgres with appropriate indexes for: role; birth year; dominant foot; club; team; competition; season; verified status; stats ranges where performant. Text search can start with Postgres capabilities.

**Later:** move discovery to dedicated search infrastructure only when required, e.g. Typesense/Meilisearch/Algolia/OpenSearch/etc. Keep search behind scoutingService so implementation can be swapped.

---

## 28. Moderation

Moderation is a launch requirement, not a future luxury.

Minimum MVP moderation: report content; report user; block user; hide/unpublish content; suspend user; moderation queue; audit moderator action; support/contact route.

For video, create moderation status before public publication. Do not expose public comments/DMs in Phase 1; this reduces moderation surface dramatically.

---

## 29. Security baseline

RLS everywhere appropriate; no secrets in clients; rate-limit sensitive endpoints; validate file type and duration server-side; random/non-guessable storage object names; signed/private access where needed; protect admin routes with explicit internal role; audit professional verification changes; sanitize user-generated text; validate all API payloads with schemas; CSRF protections where relevant to web flows; bot/abuse protection on signup and upload if attacks appear; backups and migration discipline; dependency/security updates.

---

## 30. Account deletion and retention

Product must support account deletion from inside the app before App Store release.

Deletion design must distinguish: personal account/profile data to delete; historical competition facts that may need anonymization rather than deletion; club records owned by an organization; legally required records; moderation/audit records with justified retention.

Do not promise "everything immediately disappears" before retention policy is legally defined. Implement a documented deletion workflow rather than raw cascading deletion from UI.

---

## 31. Legal/privacy risk register

These items require specialist review before production scale.

**Critical**

- **A. Minors** — 13–17 user-generated public profiles and videos. Mitigation: guardian workflow; minimization; no open DMs; clear minor-facing notices; public-data controls.
- **B. AI player scoring used in recruitment** — risk: AI rating could become a consequential recruitment/selection system. Mitigation: MVP = gamification/supporting observations; no automated scout ranking based primarily on AI; human decision always explicit; retain provenance/confidence; specific AI Act legal classification before professional decision automation.
- **C. Health/injury data** — mitigation: omit from MVP; later explicit specialist privacy design.
- **D. Public data ingestion/database rights** — mitigation: permitted/official sources first; source provenance; legal review before mass scraping; source adapters.
- **E. UGC/App Store** — mitigation: reporting/blocking/moderation/support/account deletion from MVP architecture.
- **F. App Store billing** — mitigation: defer Scout Individual billing implementation until payment-route review; organization subscriptions modeled separately.

---

## 32. Phase plan

### Phase 0 — Foundation

Goal: repo and database safe enough to build on.

Deliverables: monorepo/workspaces confirmed; Expo app skeleton; Next.js web skeleton; Supabase dev setup; environment separation; migration workflow; typed Supabase clients; auth skeleton; profiles tables; RLS baseline; CI checks; seed data; architecture docs.

Exit criteria: developer can clone repo, configure env, run web/mobile, run migrations, sign up/login in dev; no service secrets leak to client; lint/typecheck/build pass.

### Phase 1 — Player MVP

Goal: a real player can create a safe football profile and share it.

Deliverables: player onboarding; guardian-required state for 13–17; player profile; gaming-style card UI; photo upload; public/private field separation; clip upload max 60 seconds; clip metadata/category; basic AI-analysis schema and mocked/controlled pipeline; public player page; privacy controls; report/block primitives; account deletion request flow.

Important: AI may initially be mocked or use a minimal provider implementation behind aiService. Architecture matters more than sophisticated scoring at this stage.

Exit criteria: 20–50 test players can complete onboarding without admin intervention; minor account cannot publish without guardian approval; 60-second rule enforced; a public profile contains no private contact/guardian data; retrying upload/profile writes does not duplicate logical records.

### Phase 2 — Club workspace

Deliverables: club creation/claim; unlimited member invitations; roles; teams; team scopes; rosters; player club-verification flow; club audit log; longer club media configuration.

### Phase 3 — Competitions/statistics

Deliverables: seasons; competitions; groups; matchdays; fixtures/results; standings; public pages no login; source provenance; limited pilot importer; match appearances/events; derived player stats.

### Phase 4 — Scout Pro

Deliverables: verified scout account; structured player search; shortlist; private notes; comparison; professional contact request workflow. No AI-based automatic recruitment ranking until legal classification has been reviewed.

### Phase 5 — Commercialization

Deliverables: entitlements; club billing; Scout billing route after App Store review; Enterprise organizations; moderation operations; analytics/observability; plan limits.

### Phase 6 — TestFlight/App Store

Deliverables: EAS production build; Sign in with Apple if required; privacy nutrition labels/data declarations; moderation complete; account deletion complete; legal docs linked; support contact; App Review test credentials; TestFlight testing; production submission.

---

## 33. Phase 1 API/service surface

Keep service names stable even if implementation changes.

```
authService.signUp()
authService.signIn()
authService.signOut()
authService.requestDeletion()

playerService.createProfile()
playerService.updateProfile()
playerService.getMyProfile()
playerService.getPublicProfile()
playerService.updateVisibility()

guardianService.createRequest()
guardianService.approveRelationship()
guardianService.revokeConsent()

mediaService.createUpload()
mediaService.completeUpload()
mediaService.deleteMedia()
mediaService.getPlayableUrl()

clipService.createClip()
clipService.listPlayerClips()
clipService.publishClip()
clipService.deleteClip()

aiService.requestClipAnalysis()
aiService.getLatestPlayerAnalysis()

moderationService.reportContent()
moderationService.blockUser()
```

---

## 34. Example player profile schema — conceptual

```ts
PlayerProfile {
  id: UUID
  userId: UUID
  slug: string
  displayName: string
  birthYear: number
  heightCm?: number
  dominantFoot: 'left' | 'right' | 'both'
  preferredRole: FootballRole
  secondaryRoles: FootballRole[]
  currentClubDisplay?: string
  currentTeamId?: UUID
  shirtNumber?: number
  avatarMediaId?: UUID
  visibility: 'private' | 'public'
  guardianPublicationApproved: boolean // derived; do not make this user-editable
  verificationStatus: 'unverified' | 'club_verified'
  createdAt: timestamp
  updatedAt: timestamp
}
```

Exact DOB must not live in the public profile row if avoidable.

---

## 35. Player rating snapshot — conceptual

```ts
PlayerRatingSnapshot {
  id: UUID
  playerId: UUID
  version: number
  overall?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  confidence: number
  evidenceCoverage: Json
  generatedBy: 'ai' | 'hybrid' | 'manual'
  analysisRunId?: UUID
  createdAt: timestamp
}
```

Support null/insufficient-data attributes. Do not compute overall if evidence coverage is too low.

---

## 36. Deployment environments

- **Development:** dev Supabase; Vercel preview/dev; development AI keys; test users.
- **Production:** separate production Supabase; Vercel production; production secrets; real backups/monitoring.

Never point preview branches at production write credentials.

---

## 37. Git workflow

Recommended: main = production-ready; feature branches; Vercel Preview for PRs; migrations included in PR; no manual untracked schema modifications; migration filenames timestamped/descriptive; seed contains fake data only.

Claude Code should show SQL migrations before applying them to any remote production environment.

---

## 38. Tests required early

**RLS tests** — at minimum verify: anon cannot read private player data; player A cannot edit player B; minor cannot self-enable guardian approval; club member from club A cannot edit club B; content manager cannot perform owner-only action; public profile exposes only permitted fields.

**Idempotency tests** — same event operation sent twice creates one event; same upload-complete callback sent twice creates one logical clip; guardian approval retry does not create duplicate relationships.

**Concurrency tests** — two club staff updates to the same sensitive record produce conflict/atomic result, not silent corruption.

**Media tests** — over-60-second player clip rejected; disallowed MIME rejected; private/unpublished clip inaccessible publicly.

---

## 39. Load/scaling validation

Do not optimize blindly, but before public viral launch test: public profile reads; feed/list pagination; competition/result pages; login bursts; direct media upload initiation; club dashboard reads; cache hit behavior.

Simulate read-heavy concurrency separately from write-heavy workloads. 10,000 simultaneous app users must not imply 10,000 direct DB sessions or 10,000 mandatory Realtime sockets.

---

## 40. Product decisions intentionally deferred

Do not block Phase 1 on these: final brand/name; final AI model/provider; exact club-video duration limit; nationwide competition ingestion; real-time live match feature; final rating formula; player market value; agent/procuratore accounts; player transfer workflows; enterprise API; advanced scouting recommendation; injury/medical data; Android public launch; advertising; final payment implementation.

---

## 41. First prototype screens

**Mobile:** 1. Splash / welcome; 2. Sign up / login; 3. Birth date / age gate; 4. Guardian-required screen; 5. Player creation wizard; 6. Player home/card; 7. Edit football profile; 8. Clips list; 9. Upload/trim/category clip; 10. Clip analysis result; 11. Career/profile page; 12. Public profile preview; 13. Privacy/settings; 14. Report/block flow; 15. Delete account flow.

**Web:** 1. Landing page; 2. Public player profile; 3. Placeholder competitions/results area; 4. Authentication callbacks if needed; 5. Internal minimal moderation/admin screen only if necessary for Phase 1 testing.

---

## 42. Visual design principles

Player app: dark/premium sports visual language; large player card; progression motion/animation used sparingly; obvious role/foot/year/club; stat bars/radials/cards; clear distinction between verified fact and AI estimate; mobile-first one-handed interaction; upload progress obvious; no clutter.

Professional club/scout UI later: less game-like; more dense/data-oriented; desktop-first dashboard available on web; tables, filters, audit and verification status prominent.

One product, two emotional modes: player = career/gaming; professional = data/productivity.

---

## 43. Key product truth model

Every important displayed datum should have one of these conceptual origins:

1. Self-declared — player entered it.
2. Club verified — club confirmed it.
3. Official/public source — imported from a permitted source.
4. Derived — computed from match records.
5. AI observed — inferred from media/data.
6. Scout private — professional note, not public truth.

The UI should communicate origin where it matters. Do not merge these silently.

---

## 44. Definition of success for prototype

The prototype is successful if we can demonstrate this loop:

1. a 15-year-old creates a profile;
2. guardian approves publication;
3. player creates a game-like card;
4. uploads a <=60-second clip;
5. clip is safely stored and processed;
6. AI produces conservative structured observations;
7. public profile can be shared;
8. a test club can later associate/verify the player;
9. data remains correctly separated/private;
10. architecture supports adding seasons, matches and scouting without rewriting identity/data ownership.

The prototype does not need to prove nationwide scale yet.

---

## 45. Reference notes for implementation/legal review

These are starting references, not substitutes for legal advice.

- Apple App Review Guidelines — User Generated Content, login and purchase rules: https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion requirement: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo App Store submission: https://docs.expo.dev/submit/ios/
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase resumable Storage uploads: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Supabase Postgres connection guidance: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
- Italian Privacy Code — minors / art. 2-quinquies (Garante): https://www.garanteprivacy.it/temi/minori
- GDPR / health data / special categories: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EU database-right framework: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009
- EU AI Act Annex III: https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3

---

## 46. Immediate next implementation instruction for Claude Code

After reading this entire file, do not immediately build the full application.

Respond first with: 1. repository audit; 2. detected framework/package versions; 3. current Vercel/Supabase integration state; 4. gaps/conflicts with this architecture; 5. proposed Phase 0 file tree; 6. first migration plan; 7. security/RLS plan; 8. exact list of files you intend to create/change; 9. commands/tests you will run.

Then implement Phase 0 in small reviewable batches. When Phase 0 passes, proceed to Phase 1 only.

---

*End of Master Spec v0.1*
