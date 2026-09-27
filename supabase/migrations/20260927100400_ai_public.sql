-- =============================================================================
-- AI analysis provenance, rating snapshots, and the public profile read model.
-- Master spec §4.2, §6, §35.
--
-- All AI writes happen server-side with the service role. Every run keeps
-- provider/model/prompt/schema versions and its media inputs. Attribute scores
-- are nullable: null means insufficient data, never "bad".
-- =============================================================================

create table public.ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  clip_id uuid references public.player_clips (id) on delete set null,
  provider text not null,
  model text not null,
  model_version text not null,
  prompt_version text not null,
  schema_version text not null,
  input_media_ids uuid[] not null,
  status text not null default 'running' check (status in ('queued', 'running', 'succeeded', 'failed')),
  summary text,
  limitations text[] not null default '{}',
  missing_evidence text[] not null default '{}',
  error text,
  -- e.g. "<clip_id>:<provider>:<model_version>:<prompt_version>"
  idempotency_key text not null unique,
  requested_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index ai_analysis_runs_player_idx on public.ai_analysis_runs (player_profile_id, created_at desc);
create index ai_analysis_runs_clip_idx on public.ai_analysis_runs (clip_id) where clip_id is not null;

create table public.ai_observations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_analysis_runs (id) on delete cascade,
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  attribute text not null check (attribute in ('pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical')),
  score smallint check (score between 1 and 99),
  confidence numeric(3, 2) not null check (confidence between 0 and 1),
  evidence_count integer not null check (evidence_count >= 0),
  source_type text not null check (source_type in ('player_selected_clips', 'club_media', 'match_data', 'manual')),
  limitations text[] not null default '{}',
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (run_id, attribute)
);
create index ai_observations_player_idx on public.ai_observations (player_profile_id, attribute);

create table public.player_rating_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  version integer not null check (version > 0),
  overall smallint check (overall between 1 and 99),
  pace smallint check (pace between 1 and 99),
  shooting smallint check (shooting between 1 and 99),
  passing smallint check (passing between 1 and 99),
  dribbling smallint check (dribbling between 1 and 99),
  defending smallint check (defending between 1 and 99),
  physical smallint check (physical between 1 and 99),
  confidence numeric(3, 2) not null check (confidence between 0 and 1),
  -- Per attribute: {status, confidence, level, evidenceCount, sources}
  attribute_details jsonb not null,
  evidence_coverage jsonb not null default '{}',
  generated_by text not null check (generated_by in ('ai', 'hybrid', 'manual')),
  analysis_run_id uuid references public.ai_analysis_runs (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (player_profile_id, version)
);
create index player_rating_snapshots_latest_idx on public.player_rating_snapshots (player_profile_id, version desc);

-- SERVICE ROLE ONLY. Creates (or returns) the run for an idempotency key.
-- A failed run with the same key is reset for retry.
create function public.ai_begin_run(
  p_clip_id uuid,
  p_provider text,
  p_model text,
  p_model_version text,
  p_prompt_version text,
  p_schema_version text,
  p_requested_by uuid
) returns table (run_id uuid, run_status text, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clip public.player_clips;
  v_media public.media_assets;
  v_key text := p_clip_id::text || ':' || p_provider || ':' || p_model_version || ':' || p_prompt_version;
  v_run public.ai_analysis_runs;
begin
  select * into v_clip from public.player_clips where id = p_clip_id and deleted_at is null;
  if not found then perform public.raise_app_error('clip_not_found'); end if;
  if not exists (select 1 from public.player_profiles p where p.id = v_clip.player_profile_id and p.user_id = p_requested_by) then
    perform public.raise_app_error('forbidden');
  end if;
  select * into v_media from public.media_assets where id = v_clip.media_id;
  if v_media.status not in ('pending_moderation', 'published') then perform public.raise_app_error('media_not_ready'); end if;
  if not public.player_scope_allowed(v_clip.player_profile_id, 'ai_analysis') then
    perform public.raise_app_error('guardian_consent_required');
  end if;

  insert into public.ai_analysis_runs (player_profile_id, clip_id, provider, model, model_version, prompt_version,
    schema_version, input_media_ids, idempotency_key, requested_by)
  values (v_clip.player_profile_id, p_clip_id, p_provider, p_model, p_model_version, p_prompt_version,
    p_schema_version, array[v_clip.media_id], v_key, p_requested_by)
  on conflict (idempotency_key) do nothing
  returning * into v_run;
  if found then return query select v_run.id, v_run.status, true; return; end if;

  select * into v_run from public.ai_analysis_runs where idempotency_key = v_key for update;
  if v_run.status = 'failed' then
    update public.ai_analysis_runs set status = 'running', error = null where id = v_run.id;
    return query select v_run.id, 'running'::text, true;
    return;
  end if;
  return query select v_run.id, v_run.status, false;
end;
$$;

-- SERVICE ROLE ONLY. Stores observations and the new snapshot atomically.
create function public.ai_complete_run(
  p_run_id uuid,
  p_observations jsonb,
  p_summary text,
  p_limitations text[],
  p_missing_evidence text[],
  p_snapshot jsonb
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.ai_analysis_runs;
  v_version integer;
begin
  select * into v_run from public.ai_analysis_runs where id = p_run_id for update;
  if not found then perform public.raise_app_error('run_not_found'); end if;
  if v_run.status = 'succeeded' then
    return (select max(version) from public.player_rating_snapshots where analysis_run_id = p_run_id);
  end if;

  insert into public.ai_observations (run_id, player_profile_id, attribute, score, confidence, evidence_count, source_type, limitations, evidence)
  select p_run_id, v_run.player_profile_id, o->>'attribute', (o->>'score')::smallint, (o->>'confidence')::numeric,
         (o->>'evidenceCount')::integer, o->>'sourceType',
         coalesce(array(select jsonb_array_elements_text(o->'limitations')), '{}'), coalesce(o->'evidence', '{}')
  from jsonb_array_elements(p_observations) o
  on conflict (run_id, attribute) do nothing;

  update public.ai_analysis_runs
     set status = 'succeeded', summary = p_summary, limitations = coalesce(p_limitations, '{}'),
         missing_evidence = coalesce(p_missing_evidence, '{}'), completed_at = now()
   where id = p_run_id;

  if p_snapshot is not null then
    perform 1 from public.player_profiles where id = v_run.player_profile_id for update;
    select coalesce(max(version), 0) + 1 into v_version from public.player_rating_snapshots
      where player_profile_id = v_run.player_profile_id;
    insert into public.player_rating_snapshots (player_profile_id, version, overall, pace, shooting, passing, dribbling,
      defending, physical, confidence, attribute_details, evidence_coverage, generated_by, analysis_run_id)
    values (v_run.player_profile_id, v_version, (p_snapshot->>'overall')::smallint,
      (p_snapshot->>'pace')::smallint, (p_snapshot->>'shooting')::smallint, (p_snapshot->>'passing')::smallint,
      (p_snapshot->>'dribbling')::smallint, (p_snapshot->>'defending')::smallint, (p_snapshot->>'physical')::smallint,
      (p_snapshot->>'confidence')::numeric, p_snapshot->'attribute_details', coalesce(p_snapshot->'evidence_coverage', '{}'),
      'ai', p_run_id);
  end if;
  return v_version;
end;
$$;

create function public.ai_fail_run(p_run_id uuid, p_error text) returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_analysis_runs set status = 'failed', error = left(p_error, 1000), completed_at = now()
  where id = p_run_id and status <> 'succeeded';
$$;

-- -----------------------------------------------------------------------------
-- Public read model — explicit whitelist. No user ids, DOB, guardian data,
-- moderation internals or unpublished media.
-- -----------------------------------------------------------------------------

create function public.get_public_player_profile(p_slug text) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with p as (
    select pp.* from public.player_profiles pp
    where pp.slug = p_slug
      and public.player_is_public(pp.id)
      and not public.users_blocked_between((select auth.uid()), pp.user_id)
  ),
  snap as (
    select s.* from public.player_rating_snapshots s, p
    where s.player_profile_id = p.id
    order by s.version desc limit 1
  )
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'display_name', p.display_name,
    'birth_year', p.birth_year,
    'height_cm', p.height_cm,
    'dominant_foot', p.dominant_foot,
    'preferred_role', p.preferred_role,
    'secondary_roles', to_jsonb(p.secondary_roles),
    'current_club_display', p.current_club_display,
    'shirt_number', p.shirt_number,
    'bio', p.bio,
    'verification_status', p.verification_status,
    'avatar_media_id', (select m.id from public.media_assets m where m.id = p.avatar_media_id and m.status = 'published'),
    'rating', (select jsonb_build_object(
        'version', snap.version, 'overall', snap.overall, 'pace', snap.pace, 'shooting', snap.shooting,
        'passing', snap.passing, 'dribbling', snap.dribbling, 'defending', snap.defending, 'physical', snap.physical,
        'confidence', snap.confidence, 'attribute_details', snap.attribute_details, 'generated_by', snap.generated_by,
        'created_at', snap.created_at)
      from snap
      where public.player_scope_allowed(p.id, 'ai_analysis')),
    'clips', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', c.id, 'media_id', c.media_id, 'category', c.category, 'title', c.title,
          'duration_ms', m.verified_duration_ms, 'created_at', c.created_at)
        order by c.created_at desc)
      from public.player_clips c
      join public.media_assets m on m.id = c.media_id
      where c.player_profile_id = p.id and public.clip_is_public(c.id)), '[]'::jsonb),
    'updated_at', p.updated_at
  )
  from p;
$$;

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------

alter table public.ai_analysis_runs enable row level security;
alter table public.ai_observations enable row level security;
alter table public.player_rating_snapshots enable row level security;
revoke all on public.ai_analysis_runs, public.ai_observations, public.player_rating_snapshots from anon, authenticated;

grant select on public.ai_analysis_runs, public.ai_observations, public.player_rating_snapshots to authenticated;

create policy ai_runs_select on public.ai_analysis_runs for select to authenticated
  using (player_profile_id = (select public.my_player_profile_id())
         or (select public.is_guardian_of(player_profile_id))
         or (select public.is_platform_staff()));
create policy ai_observations_select on public.ai_observations for select to authenticated
  using (player_profile_id = (select public.my_player_profile_id())
         or (select public.is_guardian_of(player_profile_id))
         or (select public.is_platform_staff()));
create policy rating_snapshots_select on public.player_rating_snapshots for select to authenticated
  using (player_profile_id = (select public.my_player_profile_id())
         or (select public.is_guardian_of(player_profile_id))
         or (select public.is_platform_staff()));

grant execute on function public.get_public_player_profile(text) to anon, authenticated;
grant execute on function public.ai_begin_run(uuid, text, text, text, text, text, uuid) to service_role;
grant execute on function public.ai_complete_run(uuid, jsonb, text, text[], text[], jsonb) to service_role;
grant execute on function public.ai_fail_run(uuid, text) to service_role;
