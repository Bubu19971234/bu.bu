-- =============================================================================
-- Players and guardians. Master spec §3.2, §3.3, §8, §18, §34.
--
-- * player_profiles holds only publishable football data. Exact DOB lives in
--   account_private_data; guardian identity in guardian_* tables.
-- * Players cannot self-set verification, moderation, guardian approval or
--   ownership: those columns are not granted for UPDATE and inserts happen only
--   through player_onboard().
-- * Effective publication is computed (player_is_public), never stored as a
--   user-editable flag.
-- =============================================================================

create function public.is_football_role(p_role text) returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_role = any (array['GK','RB','CB','LB','RWB','LWB','DM','CM','AM','RM','LM','RW','LW','SS','ST']);
$$;

create function public.are_football_roles(p_roles text[]) returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_roles <@ array['GK','RB','CB','LB','RWB','LWB','DM','CM','AM','RM','LM','RW','LW','SS','ST']::text[];
$$;

create table public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  -- Nullable so the profile can be anonymized while historical football facts
  -- that reference it survive account deletion (spec §30).
  user_id uuid unique references public.profiles (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_year smallint not null check (birth_year between 1900 and 2100),
  height_cm smallint check (height_cm between 120 and 230),
  dominant_foot text not null check (dominant_foot in ('left', 'right', 'both')),
  preferred_role text not null check (public.is_football_role(preferred_role)),
  secondary_roles text[] not null default '{}'
    check (cardinality(secondary_roles) <= 3 and public.are_football_roles(secondary_roles)),
  current_club_display text check (char_length(current_club_display) <= 80),
  shirt_number smallint check (shirt_number between 1 and 99),
  bio text check (char_length(bio) <= 280),
  avatar_media_id uuid,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'club_verified')),
  moderation_status text not null default 'ok' check (moderation_status in ('ok', 'hidden')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint player_profiles_secondary_not_preferred check (not (preferred_role = any (secondary_roles)))
);

create index player_profiles_public_idx on public.player_profiles (visibility, moderation_status) where deleted_at is null;
create index player_profiles_created_idx on public.player_profiles (created_at desc, id desc);

-- Optimistic concurrency + protected-column guard.
create function public.player_profiles_before_update() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.avatar_media_id is distinct from old.avatar_media_id and new.avatar_media_id is not null then
    if not exists (
      select 1 from public.media_assets m
      where m.id = new.avatar_media_id
        and m.owner_user_id = old.user_id
        and m.kind = 'avatar'
        and m.status in ('pending_moderation', 'published')
    ) then
      perform public.raise_app_error('invalid_avatar_media');
    end if;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger player_profiles_before_update before update on public.player_profiles
  for each row execute function public.player_profiles_before_update();

-- -----------------------------------------------------------------------------
-- Guardians
-- -----------------------------------------------------------------------------

create table public.guardian_relationships (
  id uuid primary key default gen_random_uuid(),
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  guardian_user_id uuid references public.profiles (id) on delete set null,
  invited_email text not null check (invited_email = lower(invited_email) and invited_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  relationship_type text not null check (relationship_type in ('parent', 'legal_guardian')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'expired', 'declined')),
  -- How the guardian identity was established. Phase 1: the guardian's
  -- confirmed login email matched the invited address. This is NOT identity
  -- verification; see docs/SECURITY.md (risk register).
  verification_state text not null default 'unverified'
    check (verification_state in ('unverified', 'email_matched', 'document_verified')),
  invite_token_hash text unique,
  invite_expires_at timestamptz,
  invited_by_user_id uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index guardian_relationships_one_pending_per_email
  on public.guardian_relationships (player_profile_id, invited_email) where status = 'pending';
create unique index guardian_relationships_one_active_per_guardian
  on public.guardian_relationships (player_profile_id, guardian_user_id) where status = 'active';
create index guardian_relationships_guardian_idx on public.guardian_relationships (guardian_user_id, status);
create index guardian_relationships_player_idx on public.guardian_relationships (player_profile_id, status);
create index guardian_relationships_created_idx on public.guardian_relationships (invited_by_user_id, created_at desc);

create trigger guardian_relationships_set_updated_at before update on public.guardian_relationships
  for each row execute function public.set_updated_at();

-- Versioned, auditable consent records (spec §8.3). Revocation sets
-- revoked_at; rows are never deleted by product flows.
create table public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.guardian_relationships (id) on delete cascade,
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  guardian_user_id uuid references public.profiles (id) on delete set null,
  consent_version text not null,
  terms_version text not null,
  privacy_version text not null,
  scopes text[] not null check (cardinality(scopes) > 0 and scopes <@ array['public_profile', 'public_clips', 'ai_analysis']::text[]),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  -- IP/user-agent intentionally not collected in Phase 1 (no documented legal basis yet).
  created_at timestamptz not null default now()
);

create unique index guardian_consents_one_active_per_relationship
  on public.guardian_consents (relationship_id) where revoked_at is null;
create index guardian_consents_player_active_idx on public.guardian_consents (player_profile_id) where revoked_at is null;

-- -----------------------------------------------------------------------------
-- Derived state helpers
-- -----------------------------------------------------------------------------

create function public.player_is_minor(p_player_profile_id uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Unknown DOB (e.g. anonymized) is treated as minor: the conservative default.
  select coalesce((
    select public.age_on(d.date_of_birth) < 18
    from public.player_profiles p
    join public.account_private_data d on d.user_id = p.user_id
    where p.id = p_player_profile_id
  ), true);
$$;

create function public.player_has_guardian_consent(p_player_profile_id uuid, p_scope text) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guardian_consents c
    join public.guardian_relationships r on r.id = c.relationship_id
    where c.player_profile_id = p_player_profile_id
      and c.revoked_at is null
      and r.status = 'active'
      and p_scope = any (c.scopes)
  );
$$;

-- True when the player's scope-specific publication is allowed: adult, or a
-- minor with active guardian consent covering the scope.
create function public.player_scope_allowed(p_player_profile_id uuid, p_scope text) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.player_is_minor(p_player_profile_id)
      or public.player_has_guardian_consent(p_player_profile_id, p_scope);
$$;

create function public.player_is_public(p_player_profile_id uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.player_profiles p
    join public.profiles a on a.id = p.user_id
    where p.id = p_player_profile_id
      and p.deleted_at is null
      and p.visibility = 'public'
      and p.moderation_status = 'ok'
      and a.status = 'active'
  ) and public.player_scope_allowed(p_player_profile_id, 'public_profile');
$$;

create function public.my_player_profile_id() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.player_profiles where user_id = (select auth.uid()) and deleted_at is null;
$$;

-- Guardian with an active relationship to the player?
create function public.is_guardian_of(p_player_profile_id uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guardian_relationships r
    where r.player_profile_id = p_player_profile_id
      and r.guardian_user_id = (select auth.uid())
      and r.status = 'active'
  );
$$;

-- -----------------------------------------------------------------------------
-- Onboarding
-- -----------------------------------------------------------------------------

create function public.slug_base(p_text text) returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(left(trim(both '-' from regexp_replace(
    lower(translate(p_text, 'àáâãäåèéêëìíîïòóôõöùúûüçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ', 'aaaaaaeeeeiiiiooooouuuucnaaaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g')), 40), ''), 'giocatore');
$$;

-- Creates the caller's player profile atomically with their private DOB.
-- Idempotent: calling again returns the existing profile.
create function public.player_onboard(
  p_display_name text,
  p_date_of_birth date,
  p_height_cm smallint,
  p_dominant_foot text,
  p_preferred_role text,
  p_secondary_roles text[],
  p_current_club_display text,
  p_shirt_number smallint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_player public.player_profiles;
  v_age integer;
  v_slug text;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  if not public.current_user_is_active() then perform public.raise_app_error('account_inactive'); end if;

  select * into v_player from public.player_profiles where user_id = v_uid;
  if found then
    return jsonb_build_object(
      'player_profile_id', v_player.id,
      'slug', v_player.slug,
      'requires_guardian', public.player_is_minor(v_player.id),
      'created', false
    );
  end if;

  v_age := public.age_on(p_date_of_birth);
  if v_age < 13 then perform public.raise_app_error('under_minimum_age'); end if;
  perform public.account_set_date_of_birth(p_date_of_birth);

  -- Random suffix: slugs are not guessable from names alone.
  v_slug := public.slug_base(p_display_name) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.player_profiles (
    user_id, slug, display_name, birth_year, height_cm, dominant_foot,
    preferred_role, secondary_roles, current_club_display, shirt_number
  ) values (
    v_uid, v_slug, trim(p_display_name), extract(year from p_date_of_birth)::smallint, p_height_cm, p_dominant_foot,
    p_preferred_role, coalesce(p_secondary_roles, '{}'), nullif(trim(p_current_club_display), ''), p_shirt_number
  )
  on conflict (user_id) do nothing
  returning * into v_player;

  if not found then
    -- Concurrent duplicate call won the race.
    select * into v_player from public.player_profiles where user_id = v_uid;
    return jsonb_build_object('player_profile_id', v_player.id, 'slug', v_player.slug,
      'requires_guardian', public.player_is_minor(v_player.id), 'created', false);
  end if;

  perform public.write_audit('player.onboarded', 'player_profile', v_player.id, null,
    jsonb_build_object('birth_year', v_player.birth_year, 'minor', v_age < 18));

  return jsonb_build_object('player_profile_id', v_player.id, 'slug', v_player.slug,
    'requires_guardian', v_age < 18, 'created', true);
end;
$$;

-- Summary of the caller's publication state (for UI).
create function public.my_player_status() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when p.id is null then null else jsonb_build_object(
    'player_profile_id', p.id,
    'is_minor', public.player_is_minor(p.id),
    'guardian_consent_scopes', coalesce((
      select c.scopes from public.guardian_consents c
      join public.guardian_relationships r on r.id = c.relationship_id and r.status = 'active'
      where c.player_profile_id = p.id and c.revoked_at is null
      order by c.granted_at desc limit 1), '{}'::text[]),
    'is_public', public.player_is_public(p.id),
    'visibility', p.visibility,
    'moderation_status', p.moderation_status
  ) end
  from (select public.my_player_profile_id() as id) me
  left join public.player_profiles p on p.id = me.id;
$$;

-- -----------------------------------------------------------------------------
-- Guardian workflow
-- -----------------------------------------------------------------------------

-- Player (minor) invites a guardian. Idempotent per (player, email) while
-- pending. The invitation token is issued separately by the server with the
-- service role and only ever sent to the guardian's email.
create function public.guardian_request_create(p_guardian_email text, p_relationship_type text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_player_id uuid := public.my_player_profile_id();
  v_email text := lower(trim(p_guardian_email));
  v_id uuid;
  v_recent integer;
begin
  if v_player_id is null then perform public.raise_app_error('player_profile_required'); end if;
  if not public.player_is_minor(v_player_id) then perform public.raise_app_error('guardian_not_required'); end if;
  if v_email = (select lower(email) from auth.users where id = v_uid) then
    perform public.raise_app_error('guardian_email_is_self');
  end if;

  -- Serialize per player so the rate limit and pending-uniqueness are race-free.
  perform 1 from public.player_profiles where id = v_player_id for update;

  select id into v_id from public.guardian_relationships
    where player_profile_id = v_player_id and invited_email = v_email and status = 'pending';
  if found then return v_id; end if;

  select count(*) into v_recent from public.guardian_relationships
    where invited_by_user_id = v_uid and created_at > now() - interval '24 hours';
  if v_recent >= coalesce(public.config_bigint('guardian.invites.max_per_day'), 5) then
    perform public.raise_app_error('rate_limited');
  end if;

  insert into public.guardian_relationships (player_profile_id, invited_email, relationship_type, invited_by_user_id)
  values (v_player_id, v_email, p_relationship_type, v_uid)
  returning id into v_id;

  perform public.write_audit('guardian.requested', 'guardian_relationship', v_id, null,
    jsonb_build_object('relationship_type', p_relationship_type));
  return v_id;
end;
$$;

-- SERVICE ROLE ONLY. Issues (or rotates) the invitation token and returns the
-- plaintext exactly once; only its SHA-256 hash is stored.
create function public.guardian_issue_invite_token(p_relationship_id uuid)
returns table (token text, invited_email text, player_display_name text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_expires timestamptz := now() + make_interval(hours => coalesce(public.config_bigint('guardian.invite_ttl_hours'), 168)::integer);
begin
  update public.guardian_relationships r
     set invite_token_hash = encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
         invite_expires_at = v_expires
   where r.id = p_relationship_id and r.status = 'pending';
  if not found then perform public.raise_app_error('invitation_not_pending'); end if;

  return query
    select v_token, r.invited_email, p.display_name, v_expires
    from public.guardian_relationships r
    join public.player_profiles p on p.id = r.player_profile_id
    where r.id = p_relationship_id;
end;
$$;

-- Guardian previews an invitation before accepting (limited fields).
create function public.guardian_invitation_preview(p_token text) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'relationship_id', r.id,
    'player_display_name', p.display_name,
    'player_birth_year', p.birth_year,
    'relationship_type', r.relationship_type,
    'status', r.status,
    'expired', r.invite_expires_at < now(),
    'email_matches', r.invited_email = (select lower(u.email) from auth.users u where u.id = (select auth.uid())),
    'consent_version', public.config_text('guardian.consent_version')
  )
  from public.guardian_relationships r
  join public.player_profiles p on p.id = r.player_profile_id
  where r.invite_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and (select auth.uid()) is not null;
$$;

-- Guardian accepts: links account, records versioned consent. Idempotent:
-- retrying with the same token after success returns the same records.
create function public.guardian_accept(
  p_token text,
  p_consent_version text,
  p_terms_version text,
  p_privacy_version text,
  p_scopes text[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_hash text := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  v_rel public.guardian_relationships;
  v_player public.player_profiles;
  v_user auth.users;
  v_dob date;
  v_consent_id uuid;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  if not public.current_user_is_active() then perform public.raise_app_error('account_inactive'); end if;
  if p_consent_version is distinct from public.config_text('guardian.consent_version') then
    perform public.raise_app_error('consent_version_outdated');
  end if;

  select * into v_rel from public.guardian_relationships where invite_token_hash = v_hash for update;
  if not found then perform public.raise_app_error('invitation_not_found'); end if;

  if v_rel.status = 'active' and v_rel.guardian_user_id = v_uid then
    select id into v_consent_id from public.guardian_consents where relationship_id = v_rel.id and revoked_at is null;
    return jsonb_build_object('relationship_id', v_rel.id, 'consent_id', v_consent_id, 'created', false);
  end if;
  if v_rel.status <> 'pending' then perform public.raise_app_error('invitation_not_pending'); end if;
  if v_rel.invite_expires_at is null or v_rel.invite_expires_at < now() then
    perform public.raise_app_error('invitation_expired');
  end if;

  select * into v_player from public.player_profiles where id = v_rel.player_profile_id;
  if v_player.user_id = v_uid then perform public.raise_app_error('guardian_is_player'); end if;

  select * into v_user from auth.users where id = v_uid;
  if lower(v_user.email) <> v_rel.invited_email then perform public.raise_app_error('guardian_email_mismatch'); end if;
  if v_user.email_confirmed_at is null then perform public.raise_app_error('guardian_email_unconfirmed'); end if;

  select date_of_birth into v_dob from public.account_private_data where user_id = v_uid;
  if v_dob is null then perform public.raise_app_error('guardian_date_of_birth_required'); end if;
  if public.age_on(v_dob) < 18 then perform public.raise_app_error('guardian_not_adult'); end if;

  if p_scopes is null or cardinality(p_scopes) = 0 or not ('public_profile' = any (p_scopes)) then
    -- Publication requires at least the profile scope; clips/AI are optional.
    perform public.raise_app_error('public_profile_scope_required');
  end if;

  update public.guardian_relationships
     -- The token hash is kept so a retried accept by the same guardian is
     -- idempotent; any other caller gets invitation_not_pending.
     set status = 'active', guardian_user_id = v_uid, verification_state = 'email_matched',
         accepted_at = now()
   where id = v_rel.id;

  insert into public.guardian_consents (relationship_id, player_profile_id, guardian_user_id,
    consent_version, terms_version, privacy_version, scopes)
  values (v_rel.id, v_rel.player_profile_id, v_uid, p_consent_version, p_terms_version, p_privacy_version, p_scopes)
  returning id into v_consent_id;

  perform public.write_audit('guardian.consent_granted', 'guardian_consent', v_consent_id, null,
    jsonb_build_object('relationship_id', v_rel.id, 'scopes', p_scopes, 'consent_version', p_consent_version), 'guardian');

  return jsonb_build_object('relationship_id', v_rel.id, 'consent_id', v_consent_id, 'created', true);
end;
$$;

-- Guardian revokes current consent. The player is immediately non-public.
create function public.guardian_revoke_consent(p_relationship_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_consent_id uuid;
begin
  if not exists (select 1 from public.guardian_relationships
                 where id = p_relationship_id and guardian_user_id = v_uid and status = 'active') then
    perform public.raise_app_error('not_guardian');
  end if;
  update public.guardian_consents set revoked_at = now(), revoked_by_user_id = v_uid
   where relationship_id = p_relationship_id and revoked_at is null
  returning id into v_consent_id;
  if v_consent_id is not null then
    perform public.write_audit('guardian.consent_revoked', 'guardian_consent', v_consent_id, null, null, 'guardian');
  end if;
end;
$$;

-- Guardian (re-)grants consent with a new scope set. Replaces any active consent.
create function public.guardian_grant_consent(
  p_relationship_id uuid,
  p_consent_version text,
  p_terms_version text,
  p_privacy_version text,
  p_scopes text[]
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rel public.guardian_relationships;
  v_existing public.guardian_consents;
  v_id uuid;
begin
  select * into v_rel from public.guardian_relationships
    where id = p_relationship_id and guardian_user_id = v_uid and status = 'active' for update;
  if not found then perform public.raise_app_error('not_guardian'); end if;
  if p_consent_version is distinct from public.config_text('guardian.consent_version') then
    perform public.raise_app_error('consent_version_outdated');
  end if;
  if not ('public_profile' = any (coalesce(p_scopes, '{}'))) then
    perform public.raise_app_error('public_profile_scope_required');
  end if;

  select * into v_existing from public.guardian_consents where relationship_id = p_relationship_id and revoked_at is null;
  if found then
    if v_existing.scopes @> p_scopes and v_existing.scopes <@ p_scopes and v_existing.consent_version = p_consent_version then
      return v_existing.id;
    end if;
    update public.guardian_consents set revoked_at = now(), revoked_by_user_id = v_uid where id = v_existing.id;
  end if;

  insert into public.guardian_consents (relationship_id, player_profile_id, guardian_user_id,
    consent_version, terms_version, privacy_version, scopes)
  values (p_relationship_id, v_rel.player_profile_id, v_uid, p_consent_version, p_terms_version, p_privacy_version, p_scopes)
  returning id into v_id;
  perform public.write_audit('guardian.consent_granted', 'guardian_consent', v_id, null,
    jsonb_build_object('scopes', p_scopes, 'consent_version', p_consent_version), 'guardian');
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------

alter table public.player_profiles enable row level security;
alter table public.guardian_relationships enable row level security;
alter table public.guardian_consents enable row level security;

revoke all on public.player_profiles, public.guardian_relationships, public.guardian_consents from anon, authenticated;

-- player_profiles: no direct anon access at all. Public reads go through
-- get_public_player_profile(), which returns an explicit field whitelist.
grant select on public.player_profiles to authenticated;
grant update (display_name, height_cm, dominant_foot, preferred_role, secondary_roles,
  current_club_display, shirt_number, bio, visibility, avatar_media_id)
  on public.player_profiles to authenticated;

create policy player_profiles_select on public.player_profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_guardian_of(id))
    or (select public.is_platform_staff())
  );

create policy player_profiles_update_own on public.player_profiles for update to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null and (select public.current_user_is_active()))
  with check (user_id = (select auth.uid()) and deleted_at is null);

-- guardian_relationships: token hash is never selectable.
grant select (id, player_profile_id, guardian_user_id, invited_email, relationship_type, status,
  verification_state, invite_expires_at, accepted_at, revoked_at, created_at, updated_at)
  on public.guardian_relationships to authenticated;

create policy guardian_relationships_select on public.guardian_relationships for select to authenticated
  using (
    guardian_user_id = (select auth.uid())
    or player_profile_id = (select public.my_player_profile_id())
    or (select public.is_platform_staff())
  );

grant select on public.guardian_consents to authenticated;
create policy guardian_consents_select on public.guardian_consents for select to authenticated
  using (
    guardian_user_id = (select auth.uid())
    or player_profile_id = (select public.my_player_profile_id())
    or (select public.is_platform_staff())
  );

grant execute on function public.is_football_role(text) to anon, authenticated;
grant execute on function public.are_football_roles(text[]) to anon, authenticated;
grant execute on function public.player_onboard(text, date, smallint, text, text, text[], text, smallint) to authenticated;
grant execute on function public.my_player_profile_id() to authenticated;
grant execute on function public.my_player_status() to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
grant execute on function public.guardian_request_create(text, text) to authenticated;
grant execute on function public.guardian_invitation_preview(text) to authenticated;
grant execute on function public.guardian_accept(text, text, text, text, text[]) to authenticated;
grant execute on function public.guardian_revoke_consent(uuid) to authenticated;
grant execute on function public.guardian_grant_consent(uuid, text, text, text, text[]) to authenticated;
grant execute on function public.guardian_issue_invite_token(uuid) to service_role;
