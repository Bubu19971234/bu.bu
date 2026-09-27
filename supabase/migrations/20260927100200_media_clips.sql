-- =============================================================================
-- Media assets and player clips. Master spec §5.
--
-- Flow: media_create_upload (row 'uploading' + namespaced random path)
--   → client uploads directly to Storage (policy requires that row)
--   → media_complete_upload ('uploaded')
--   → server probe with service role: media_begin_processing / media_record_probe
--     ('pending_moderation' or 'rejected'/'failed')
--   → moderator decision ('published' / 'rejected').
-- Upload success never publishes by itself. The 60 s player-clip rule is a
-- table CHECK constraint on verified (server-measured) duration.
-- =============================================================================

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('avatar', 'player_clip')),
  status text not null default 'uploading' check (status in (
    'uploading', 'uploaded', 'processing', 'pending_moderation', 'published', 'rejected', 'failed', 'deleted')),
  bucket text not null,
  storage_path text not null unique,
  processed_path text,
  declared_mime text not null,
  declared_size_bytes bigint not null check (declared_size_bytes > 0),
  declared_duration_ms integer check (declared_duration_ms > 0),
  verified_mime text,
  verified_size_bytes bigint,
  verified_duration_ms integer,
  rejection_reason text,
  client_operation_id uuid not null,
  moderated_by uuid,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_user_id, client_operation_id),
  constraint media_assets_player_clip_duration check (
    kind <> 'player_clip'
    or status not in ('pending_moderation', 'published')
    or (verified_duration_ms is not null and verified_duration_ms <= 60000)
  ),
  constraint media_assets_verified_before_review check (
    status not in ('pending_moderation', 'published')
    or (verified_mime is not null and verified_size_bytes is not null)
  )
);

create index media_assets_owner_idx on public.media_assets (owner_user_id, kind, status);
create index media_assets_moderation_queue_idx on public.media_assets (created_at) where status = 'pending_moderation';
create index media_assets_owner_recent_idx on public.media_assets (owner_user_id, created_at desc);

create trigger media_assets_set_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

alter table public.player_profiles
  add constraint player_profiles_avatar_media_fk foreign key (avatar_media_id)
  references public.media_assets (id) on delete set null;
create index player_profiles_avatar_media_idx on public.player_profiles (avatar_media_id) where avatar_media_id is not null;

create table public.player_clips (
  id uuid primary key default gen_random_uuid(),
  player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
  -- One logical clip per uploaded media: retries cannot duplicate clips.
  media_id uuid not null unique references public.media_assets (id) on delete restrict,
  category text not null check (category in (
    'dribbling', 'shooting', 'passing', 'build_up', 'defending', 'athletic', 'set_piece', 'goalkeeping', 'other')),
  title text check (char_length(title) <= 80),
  -- Player-provided hint of who they are in the clip (shirt, position...).
  identification_note text check (char_length(identification_note) <= 200),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index player_clips_player_idx on public.player_clips (player_profile_id, created_at desc, id desc) where deleted_at is null;

create function public.player_clips_before_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger player_clips_before_update before update on public.player_clips
  for each row execute function public.player_clips_before_update();

-- -----------------------------------------------------------------------------
-- Storage bucket (private). Objects live at
--   u/<owner uuid>/<kind>/<media uuid>.<ext>
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-media', 'player-media', false, 157286400,
        array['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads are accepted only for a path reserved by media_create_upload for
-- the same user and still in 'uploading' state.
create policy player_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'player-media'
    and exists (
      select 1 from public.media_assets m
      where m.storage_path = name
        and m.bucket = 'player-media'
        and m.owner_user_id = (select auth.uid())
        and m.status = 'uploading'
    )
  );

-- Owners may read their own objects (preview, resumable upload checks).
-- Public playback is served via short-lived signed URLs minted server-side.
create policy player_media_select_own on storage.objects for select to authenticated
  using (
    bucket_id = 'player-media'
    and (storage.foldername(name))[1] = 'u'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- -----------------------------------------------------------------------------
-- Upload lifecycle
-- -----------------------------------------------------------------------------

create function public.media_allowed_mime(p_kind text, p_mime text) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_kind
    when 'player_clip' then p_mime in ('video/mp4', 'video/quicktime')
    when 'avatar' then p_mime in ('image/jpeg', 'image/png', 'image/webp')
    else false end;
$$;

create function public.media_max_bytes(p_kind text) returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case p_kind
    when 'player_clip' then coalesce(public.config_bigint('media.player_clip.max_bytes'), 157286400)
    when 'avatar' then coalesce(public.config_bigint('media.avatar.max_bytes'), 5242880)
  end;
$$;

create function public.media_create_upload(
  p_kind text,
  p_mime text,
  p_size_bytes bigint,
  p_duration_ms integer,
  p_client_operation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_player_id uuid := public.my_player_profile_id();
  v_existing public.media_assets;
  v_id uuid := gen_random_uuid();
  v_ext text;
  v_path text;
  v_recent integer;
  v_active integer;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  if not public.current_user_is_active() then perform public.raise_app_error('account_inactive'); end if;
  if v_player_id is null then perform public.raise_app_error('player_profile_required'); end if;
  if p_client_operation_id is null then perform public.raise_app_error('client_operation_id_required'); end if;

  select * into v_existing from public.media_assets
    where owner_user_id = v_uid and client_operation_id = p_client_operation_id;
  if found then
    return jsonb_build_object('media_id', v_existing.id, 'bucket', v_existing.bucket,
      'path', v_existing.storage_path, 'status', v_existing.status, 'created', false);
  end if;

  if not public.media_allowed_mime(p_kind, p_mime) then perform public.raise_app_error('mime_not_allowed'); end if;
  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > public.media_max_bytes(p_kind) then
    perform public.raise_app_error('file_too_large');
  end if;
  if p_kind = 'player_clip' then
    if p_duration_ms is null then perform public.raise_app_error('duration_missing'); end if;
    if p_duration_ms > coalesce(public.config_bigint('media.player_clip.max_duration_ms'), 60000) then
      perform public.raise_app_error('duration_exceeded');
    end if;
  end if;

  perform 1 from public.player_profiles where id = v_player_id for update;

  select count(*) into v_recent from public.media_assets
    where owner_user_id = v_uid and created_at > now() - interval '24 hours';
  if v_recent >= coalesce(public.config_bigint('media.uploads.max_per_day'), 30) then
    perform public.raise_app_error('rate_limited');
  end if;

  if p_kind = 'player_clip' then
    select count(*) into v_active from public.player_clips where player_profile_id = v_player_id and deleted_at is null;
    if v_active >= coalesce(public.config_bigint('media.player_clip.max_active'), 8) then
      perform public.raise_app_error('clip_limit_reached');
    end if;
  end if;

  v_ext := case p_mime
    when 'video/mp4' then 'mp4' when 'video/quicktime' then 'mov'
    when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' end;
  v_path := 'u/' || v_uid::text || '/' || p_kind || '/' || v_id::text || '.' || v_ext;

  insert into public.media_assets (id, owner_user_id, kind, bucket, storage_path, declared_mime,
    declared_size_bytes, declared_duration_ms, client_operation_id)
  values (v_id, v_uid, p_kind, 'player-media', v_path, p_mime, p_size_bytes, p_duration_ms, p_client_operation_id)
  on conflict (owner_user_id, client_operation_id) do nothing;

  select * into v_existing from public.media_assets
    where owner_user_id = v_uid and client_operation_id = p_client_operation_id;
  return jsonb_build_object('media_id', v_existing.id, 'bucket', v_existing.bucket,
    'path', v_existing.storage_path, 'status', v_existing.status, 'created', v_existing.id = v_id);
end;
$$;

-- Client signals the upload finished. Verifies the object exists. Idempotent.
create function public.media_complete_upload(p_media_id uuid) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media_assets;
begin
  select * into v_media from public.media_assets
    where id = p_media_id and owner_user_id = (select auth.uid()) for update;
  if not found then perform public.raise_app_error('media_not_found'); end if;
  if v_media.status <> 'uploading' then return v_media.status; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = v_media.bucket and o.name = v_media.storage_path) then
    perform public.raise_app_error('object_missing');
  end if;
  update public.media_assets set status = 'uploaded' where id = p_media_id;
  return 'uploaded';
end;
$$;

-- SERVICE ROLE ONLY. Claims an uploaded asset for probing.
create function public.media_begin_processing(p_media_id uuid)
returns table (id uuid, kind text, status text, bucket text, storage_path text, owner_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.media_assets m set status = 'processing'
    where m.id = p_media_id and m.status = 'uploaded';
  return query select m.id, m.kind, m.status, m.bucket, m.storage_path, m.owner_user_id
    from public.media_assets m where m.id = p_media_id;
end;
$$;

-- SERVICE ROLE ONLY. Records server-measured facts and decides the next state.
-- Idempotent: once decided, returns the existing status.
create function public.media_record_probe(
  p_media_id uuid,
  p_verified_mime text,
  p_verified_size_bytes bigint,
  p_verified_duration_ms integer,
  p_error text default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media_assets;
  v_status text;
  v_reason text;
begin
  select * into v_media from public.media_assets where id = p_media_id for update;
  if not found then perform public.raise_app_error('media_not_found'); end if;
  if v_media.status not in ('uploaded', 'processing') then return v_media.status; end if;

  if p_error is not null then
    v_status := 'failed'; v_reason := p_error;
  elsif not public.media_allowed_mime(v_media.kind, p_verified_mime) then
    v_status := 'rejected'; v_reason := 'mime_not_allowed';
  elsif p_verified_size_bytes is null or p_verified_size_bytes > public.media_max_bytes(v_media.kind) then
    v_status := 'rejected'; v_reason := 'file_too_large';
  elsif v_media.kind = 'player_clip' and (p_verified_duration_ms is null
        or p_verified_duration_ms > coalesce(public.config_bigint('media.player_clip.max_duration_ms'), 60000)
        or p_verified_duration_ms > 60000) then
    v_status := 'rejected'; v_reason := 'duration_exceeded';
  else
    v_status := 'pending_moderation';
  end if;

  update public.media_assets
     set status = v_status,
         verified_mime = p_verified_mime,
         verified_size_bytes = p_verified_size_bytes,
         verified_duration_ms = p_verified_duration_ms,
         rejection_reason = v_reason
   where id = p_media_id;
  return v_status;
end;
$$;

-- Owner soft-deletes media. Object removal is done by the server cleanup job.
create function public.media_delete(p_media_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  update public.media_assets set status = 'deleted', deleted_at = coalesce(deleted_at, now())
    where id = p_media_id and owner_user_id = v_uid;
  if not found then perform public.raise_app_error('media_not_found'); end if;
  update public.player_profiles set avatar_media_id = null where avatar_media_id = p_media_id;
  update public.player_clips set deleted_at = coalesce(deleted_at, now()), visibility = 'private'
    where media_id = p_media_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Clips
-- -----------------------------------------------------------------------------

create function public.clip_create(
  p_media_id uuid,
  p_category text,
  p_title text,
  p_identification_note text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_player_id uuid := public.my_player_profile_id();
  v_media public.media_assets;
  v_clip_id uuid;
  v_active integer;
begin
  if v_player_id is null then perform public.raise_app_error('player_profile_required'); end if;
  select * into v_media from public.media_assets where id = p_media_id and owner_user_id = v_uid;
  if not found or v_media.kind <> 'player_clip' then perform public.raise_app_error('media_not_found'); end if;
  if v_media.status in ('rejected', 'failed', 'deleted') then perform public.raise_app_error('media_not_usable'); end if;

  select id into v_clip_id from public.player_clips where media_id = p_media_id;
  if found then return v_clip_id; end if;

  perform 1 from public.player_profiles where id = v_player_id for update;
  select count(*) into v_active from public.player_clips where player_profile_id = v_player_id and deleted_at is null;
  if v_active >= coalesce(public.config_bigint('media.player_clip.max_active'), 8) then
    perform public.raise_app_error('clip_limit_reached');
  end if;

  insert into public.player_clips (player_profile_id, media_id, category, title, identification_note)
  values (v_player_id, p_media_id, p_category, nullif(trim(p_title), ''), nullif(trim(p_identification_note), ''))
  on conflict (media_id) do nothing
  returning id into v_clip_id;

  if v_clip_id is null then
    select id into v_clip_id from public.player_clips where media_id = p_media_id;
  end if;
  return v_clip_id;
end;
$$;

create function public.clip_delete(p_clip_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media_id uuid;
begin
  select c.media_id into v_media_id from public.player_clips c
    join public.player_profiles p on p.id = c.player_profile_id
    where c.id = p_clip_id and p.user_id = (select auth.uid());
  if not found then perform public.raise_app_error('clip_not_found'); end if;
  perform public.media_delete(v_media_id);
end;
$$;

create function public.clip_is_public(p_clip_id uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.player_clips c
    join public.media_assets m on m.id = c.media_id
    where c.id = p_clip_id
      and c.deleted_at is null
      and c.visibility = 'public'
      and m.status = 'published'
      and public.player_is_public(c.player_profile_id)
      and public.player_scope_allowed(c.player_profile_id, 'public_clips')
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------

alter table public.media_assets enable row level security;
alter table public.player_clips enable row level security;
revoke all on public.media_assets, public.player_clips from anon, authenticated;

grant select on public.media_assets to authenticated;
create policy media_assets_select on public.media_assets for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (select public.is_platform_staff())
  );

grant select on public.player_clips to authenticated;
grant update (category, title, identification_note, visibility) on public.player_clips to authenticated;

create policy player_clips_select on public.player_clips for select to authenticated
  using (
    player_profile_id = (select public.my_player_profile_id())
    or (select public.is_guardian_of(player_profile_id))
    or (select public.is_platform_staff())
  );

create policy player_clips_update_own on public.player_clips for update to authenticated
  using (player_profile_id = (select public.my_player_profile_id()) and deleted_at is null)
  with check (player_profile_id = (select public.my_player_profile_id()) and deleted_at is null);

grant execute on function public.media_allowed_mime(text, text) to anon, authenticated;
grant execute on function public.media_create_upload(text, text, bigint, integer, uuid) to authenticated;
grant execute on function public.media_complete_upload(uuid) to authenticated;
grant execute on function public.media_delete(uuid) to authenticated;
grant execute on function public.clip_create(uuid, text, text, text) to authenticated;
grant execute on function public.clip_delete(uuid) to authenticated;
grant execute on function public.media_begin_processing(uuid) to service_role;
grant execute on function public.media_record_probe(uuid, text, bigint, integer, text) to service_role;
