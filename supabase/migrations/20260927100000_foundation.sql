-- =============================================================================
-- Foundation: shared helpers, accounts, platform staff, config, audit,
-- idempotency. Master spec §13–§17.
--
-- Conventions
--  * UUID primary keys; timestamptz everywhere.
--  * RLS enabled on every table in `public`. Grants are explicit: we revoke the
--    Supabase default table/function grants and re-grant only what the Data
--    API needs. Privileged mutations go through SECURITY DEFINER functions
--    with `search_path = ''` and fully-qualified names.
--  * `(select auth.uid())` is used in policies so Postgres evaluates it once
--    per statement instead of per row.
-- =============================================================================

-- Functions are not executable by PUBLIC unless explicitly granted.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Full years between a date of birth and a reference date.
create function public.age_on(p_date_of_birth date, p_at date default current_date)
returns integer
language sql
immutable
set search_path = ''
as $$
  select extract(year from age(p_at, p_date_of_birth))::integer;
$$;

-- Raises a structured error that clients can map (`errcode` P0001, message = code).
create function public.raise_app_error(p_code text, p_detail text default null)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_code, detail = coalesce(p_detail, p_code);
end;
$$;

-- -----------------------------------------------------------------------------
-- App configuration (non-secret limits readable by clients)
-- -----------------------------------------------------------------------------

create table public.app_config (
  key text primary key check (key ~ '^[a-z0-9_.]{3,80}$'),
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value, description) values
  ('media.player_clip.max_duration_ms', '60000', 'Hard product rule: player clips are at most 60 seconds'),
  ('media.player_clip.max_bytes', '157286400', 'Max stored size of one player clip (150 MiB)'),
  ('media.player_clip.max_active', '8', 'Max non-deleted clips per player'),
  ('media.avatar.max_bytes', '5242880', 'Max avatar image size (5 MiB)'),
  ('media.uploads.max_per_day', '30', 'Upload sessions a user may open per 24h'),
  ('guardian.invites.max_per_day', '5', 'Guardian invitations a player may create per 24h'),
  ('guardian.invite_ttl_hours', '168', 'Guardian invitation validity'),
  ('guardian.consent_version', '"2026-09-v1"', 'Current guardian consent text version'),
  ('moderation.reports.max_per_hour', '20', 'Reports a user may file per hour');

create function public.config_bigint(p_key text) returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select (value #>> '{}')::bigint from public.app_config where key = p_key;
$$;

create function public.config_text(p_key text) returns text
language sql
stable
security definer
set search_path = ''
as $$
  select value #>> '{}' from public.app_config where key = p_key;
$$;

-- -----------------------------------------------------------------------------
-- Accounts
-- -----------------------------------------------------------------------------

create type public.account_status as enum ('active', 'suspended', 'deletion_requested', 'deleted');

-- One row per auth user. Holds no personal data; role-specific data lives in
-- dedicated tables (player_profiles, account_private_data, ...).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  status public.account_status not null default 'active',
  locale text not null default 'it' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Private account data (exact date of birth). Never exposed publicly; not
-- updatable by the user once set (changes require support/admin).
create table public.account_private_data (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date not null check (date_of_birth > date '1900-01-01'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger account_private_data_set_updated_at before update on public.account_private_data
  for each row execute function public.set_updated_at();

create function public.handle_new_auth_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Is the calling user an active account?
create function public.current_user_is_active() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status = 'active'
  );
$$;

-- Sets the caller's date of birth once. Idempotent for the same value.
create function public.account_set_date_of_birth(p_date_of_birth date) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_existing date;
  v_age integer;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  v_age := public.age_on(p_date_of_birth);
  if p_date_of_birth > current_date or v_age > 100 then
    perform public.raise_app_error('invalid_date_of_birth');
  end if;
  select date_of_birth into v_existing from public.account_private_data where user_id = v_uid;
  if found then
    if v_existing <> p_date_of_birth then perform public.raise_app_error('date_of_birth_already_set'); end if;
    return;
  end if;
  insert into public.account_private_data (user_id, date_of_birth) values (v_uid, p_date_of_birth)
  on conflict (user_id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- Platform staff (internal admins/moderators). Managed via SQL/service role
-- only — never self-assignable.
-- -----------------------------------------------------------------------------

create table public.platform_staff (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  granted_by uuid,
  created_at timestamptz not null default now()
);

create function public.is_platform_staff() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_staff s
    join public.profiles p on p.id = s.user_id and p.status = 'active'
    where s.user_id = (select auth.uid())
  );
$$;

create function public.is_platform_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_staff s
    where s.user_id = (select auth.uid()) and s.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Audit log (append-only)
-- -----------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  actor_role text not null default 'user' check (actor_role in ('user', 'staff', 'system', 'guardian')),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  organization_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id, created_at desc);
create index audit_log_org_idx on public.audit_log (organization_id, created_at desc) where organization_id is not null;

create function public.write_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb default null,
  p_after jsonb default null,
  p_actor_role text default 'user',
  p_organization_id uuid default null
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_user_id, actor_role, action, entity_type, entity_id, organization_id, before_data, after_data)
  values ((select auth.uid()), p_actor_role, p_action, p_entity_type, p_entity_id, p_organization_id, p_before, p_after);
$$;

create function public.audit_log_immutable() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- -----------------------------------------------------------------------------
-- Idempotency keys for HTTP mutations (master spec §15.1). Used by server
-- routes with the service role.
-- -----------------------------------------------------------------------------

create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null,
  key text not null check (key ~ '^[A-Za-z0-9_-]{8,128}$'),
  request_hash text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'failed')),
  response jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  unique (actor_user_id, action, key)
);

create index idempotency_keys_expires_idx on public.idempotency_keys (expires_at);

-- Atomically claims a key. Returns the stored row state:
--   outcome = 'new'        → caller must execute and then call idempotency_complete
--   outcome = 'replay'     → return stored response
--   outcome = 'in_progress'→ concurrent duplicate; caller should return 409
--   outcome = 'mismatch'   → same key, different payload; caller should return 422
create function public.idempotency_begin(p_actor uuid, p_action text, p_key text, p_request_hash text)
returns table (id uuid, outcome text, response jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.idempotency_keys;
begin
  delete from public.idempotency_keys k
    where k.actor_user_id = p_actor and k.action = p_action and k.key = p_key and k.expires_at < now();

  insert into public.idempotency_keys (actor_user_id, action, key, request_hash)
  values (p_actor, p_action, p_key, p_request_hash)
  on conflict (actor_user_id, action, key) do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, 'new'::text, null::jsonb;
    return;
  end if;

  select * into v_row from public.idempotency_keys k
    where k.actor_user_id = p_actor and k.action = p_action and k.key = p_key;
  if v_row.request_hash <> p_request_hash then
    return query select v_row.id, 'mismatch'::text, null::jsonb;
  elsif v_row.status = 'completed' then
    return query select v_row.id, 'replay'::text, v_row.response;
  elsif v_row.status = 'failed' then
    update public.idempotency_keys k set status = 'in_progress' where k.id = v_row.id and k.status = 'failed';
    if found then
      return query select v_row.id, 'new'::text, null::jsonb;
    else
      return query select v_row.id, 'in_progress'::text, null::jsonb;
    end if;
  else
    return query select v_row.id, 'in_progress'::text, null::jsonb;
  end if;
end;
$$;

create function public.idempotency_finish(p_id uuid, p_status text, p_response jsonb) returns void
language sql
security definer
set search_path = ''
as $$
  update public.idempotency_keys set status = p_status, response = p_response where id = p_id;
$$;

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------

alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.account_private_data enable row level security;
alter table public.platform_staff enable row level security;
alter table public.audit_log enable row level security;
alter table public.idempotency_keys enable row level security;

revoke all on public.app_config, public.profiles, public.account_private_data, public.platform_staff,
  public.audit_log, public.idempotency_keys from anon, authenticated;

grant select on public.app_config to anon, authenticated;
create policy app_config_read on public.app_config for select to anon, authenticated using (true);

grant select on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_platform_staff()));

grant select on public.account_private_data to authenticated;
create policy account_private_data_select_own on public.account_private_data for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.platform_staff to authenticated;
create policy platform_staff_select_self on public.platform_staff for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.audit_log to authenticated;
create policy audit_log_staff_read on public.audit_log for select to authenticated
  using ((select public.is_platform_admin()));

-- idempotency_keys: no client access at all (service role bypasses RLS).

grant execute on function public.account_set_date_of_birth(date) to authenticated;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.is_platform_staff() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.age_on(date, date) to anon, authenticated;
grant execute on function public.idempotency_begin(uuid, text, text, text) to service_role;
grant execute on function public.idempotency_finish(uuid, text, jsonb) to service_role;
