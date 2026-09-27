-- =============================================================================
-- Trust & safety: reports, blocks, moderation actions, account deletion.
-- Master spec §19, §28, §30.
-- =============================================================================

create table public.user_blocks (
  blocker_user_id uuid not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);
create index user_blocks_blocked_idx on public.user_blocks (blocked_user_id);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('player_profile', 'clip', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('inappropriate', 'harassment', 'impersonation', 'minor_safety', 'spam', 'copyright', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  client_operation_id uuid not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  unique (reporter_user_id, client_operation_id)
);
create unique index content_reports_one_open_per_target
  on public.content_reports (reporter_user_id, target_type, target_id) where status in ('open', 'reviewing');
create index content_reports_queue_idx on public.content_reports (status, created_at);
create index content_reports_target_idx on public.content_reports (target_type, target_id);
create index content_reports_reporter_recent_idx on public.content_reports (reporter_user_id, created_at desc);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_user_id uuid,
  action text not null check (action in (
    'media_publish', 'media_reject', 'profile_hide', 'profile_unhide',
    'user_suspend', 'user_unsuspend', 'report_dismiss', 'report_action', 'account_deletion_processed')),
  target_type text not null,
  target_id uuid not null,
  report_id uuid references public.content_reports (id) on delete set null,
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);
create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id, created_at desc);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'processing', 'completed', 'cancelled')),
  reason text check (char_length(reason) <= 500),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid
);
create unique index account_deletion_one_open_per_user
  on public.account_deletion_requests (user_id) where status in ('requested', 'processing');
create index account_deletion_queue_idx on public.account_deletion_requests (status, requested_at);

create function public.users_blocked_between(p_a uuid, p_b uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_a is not null and p_b is not null and exists (
    select 1 from public.user_blocks b
    where (b.blocker_user_id = p_a and b.blocked_user_id = p_b)
       or (b.blocker_user_id = p_b and b.blocked_user_id = p_a)
  );
$$;

-- Returns the storage location of a playable asset if the caller may view it.
-- The server then mints a short-lived signed URL with the service role.
create function public.media_playback_target(p_media_id uuid)
returns table (bucket text, storage_path text, mime text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.bucket, m.storage_path, coalesce(m.verified_mime, m.declared_mime)
  from public.media_assets m
  where m.id = p_media_id
    and m.status not in ('deleted', 'uploading')
    and (
      m.owner_user_id = (select auth.uid())
      or public.is_platform_staff()
      or exists (select 1 from public.player_profiles p where p.user_id = m.owner_user_id and public.is_guardian_of(p.id))
      or (
        m.status = 'published'
        and not public.users_blocked_between((select auth.uid()), m.owner_user_id)
        and (
          exists (select 1 from public.player_clips c where c.media_id = m.id and public.clip_is_public(c.id))
          or exists (select 1 from public.player_profiles p where p.avatar_media_id = m.id and public.player_is_public(p.id))
        )
      )
    );
$$;

-- -----------------------------------------------------------------------------
-- User actions
-- -----------------------------------------------------------------------------

create function public.report_content(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_details text,
  p_client_operation_id uuid
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_recent integer;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  select id into v_id from public.content_reports where reporter_user_id = v_uid and client_operation_id = p_client_operation_id;
  if found then return v_id; end if;
  select id into v_id from public.content_reports
    where reporter_user_id = v_uid and target_type = p_target_type and target_id = p_target_id and status in ('open', 'reviewing');
  if found then return v_id; end if;

  if not (case p_target_type
      when 'player_profile' then exists (select 1 from public.player_profiles where id = p_target_id)
      when 'clip' then exists (select 1 from public.player_clips where id = p_target_id)
      when 'user' then exists (select 1 from public.profiles where id = p_target_id)
      else false end) then
    perform public.raise_app_error('report_target_not_found');
  end if;

  select count(*) into v_recent from public.content_reports
    where reporter_user_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= coalesce(public.config_bigint('moderation.reports.max_per_hour'), 20) then
    perform public.raise_app_error('rate_limited');
  end if;

  insert into public.content_reports (reporter_user_id, target_type, target_id, reason, details, client_operation_id)
  values (v_uid, p_target_type, p_target_id, p_reason, nullif(trim(p_details), ''), p_client_operation_id)
  on conflict do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.content_reports where reporter_user_id = v_uid and client_operation_id = p_client_operation_id;
  end if;
  return v_id;
end;
$$;

-- Block the owner of a player profile without revealing their account id.
create function public.block_player(p_player_profile_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_target uuid;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  select user_id into v_target from public.player_profiles where id = p_player_profile_id;
  if v_target is null then perform public.raise_app_error('player_not_found'); end if;
  if v_target = v_uid then perform public.raise_app_error('cannot_block_self'); end if;
  insert into public.user_blocks (blocker_user_id, blocked_user_id) values (v_uid, v_target)
  on conflict do nothing;
end;
$$;

create function public.unblock_player(p_player_profile_id uuid) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.user_blocks
  where blocker_user_id = (select auth.uid())
    and blocked_user_id = (select user_id from public.player_profiles where id = p_player_profile_id);
$$;

create function public.my_blocked_players() returns table (player_profile_id uuid, display_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, b.created_at
  from public.user_blocks b
  join public.player_profiles p on p.user_id = b.blocked_user_id
  where b.blocker_user_id = (select auth.uid())
  order by b.created_at desc;
$$;

-- Starts the documented deletion workflow (docs/SECURITY.md §Deletion). The
-- account is hidden immediately; data processing happens server-side.
create function public.account_request_deletion(p_reason text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then perform public.raise_app_error('not_authenticated'); end if;
  select id into v_id from public.account_deletion_requests where user_id = v_uid and status in ('requested', 'processing');
  if found then return v_id; end if;
  insert into public.account_deletion_requests (user_id, reason) values (v_uid, nullif(trim(p_reason), ''))
  on conflict do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.account_deletion_requests where user_id = v_uid and status in ('requested', 'processing');
  end if;
  update public.profiles set status = 'deletion_requested' where id = v_uid and status = 'active';
  perform public.write_audit('account.deletion_requested', 'profile', v_uid, null, null);
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Staff actions (every action is recorded in moderation_actions + audit_log)
-- -----------------------------------------------------------------------------

create function public.require_staff() returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_staff() then perform public.raise_app_error('forbidden'); end if;
  return (select auth.uid());
end;
$$;

create function public.moderation_decide_media(p_media_id uuid, p_decision text, p_reason text, p_report_id uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff uuid := public.require_staff();
  v_media public.media_assets;
begin
  if p_decision not in ('published', 'rejected') then perform public.raise_app_error('invalid_decision'); end if;
  select * into v_media from public.media_assets where id = p_media_id for update;
  if not found then perform public.raise_app_error('media_not_found'); end if;
  if v_media.status = p_decision then return v_media.status; end if;
  if not (v_media.status = 'pending_moderation' or (v_media.status = 'published' and p_decision = 'rejected')) then
    perform public.raise_app_error('invalid_media_state');
  end if;
  update public.media_assets
     set status = p_decision, moderated_by = v_staff, moderated_at = now(),
         rejection_reason = case when p_decision = 'rejected' then coalesce(p_reason, 'moderation') else null end
   where id = p_media_id;
  insert into public.moderation_actions (moderator_user_id, action, target_type, target_id, report_id, reason)
  values (v_staff, case p_decision when 'published' then 'media_publish' else 'media_reject' end, 'media', p_media_id, p_report_id, p_reason);
  perform public.write_audit('moderation.media_' || p_decision, 'media_asset', p_media_id,
    jsonb_build_object('status', v_media.status), jsonb_build_object('status', p_decision), 'staff');
  return p_decision;
end;
$$;

create function public.moderation_set_profile_hidden(p_player_profile_id uuid, p_hidden boolean, p_reason text, p_report_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff uuid := public.require_staff();
begin
  update public.player_profiles set moderation_status = case when p_hidden then 'hidden' else 'ok' end
    where id = p_player_profile_id;
  if not found then perform public.raise_app_error('player_not_found'); end if;
  insert into public.moderation_actions (moderator_user_id, action, target_type, target_id, report_id, reason)
  values (v_staff, case when p_hidden then 'profile_hide' else 'profile_unhide' end, 'player_profile', p_player_profile_id, p_report_id, p_reason);
  perform public.write_audit(case when p_hidden then 'moderation.profile_hidden' else 'moderation.profile_unhidden' end,
    'player_profile', p_player_profile_id, null, null, 'staff');
end;
$$;

create function public.moderation_set_user_suspended(p_user_id uuid, p_suspended boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff uuid := public.require_staff();
begin
  if p_user_id = v_staff then perform public.raise_app_error('cannot_moderate_self'); end if;
  update public.profiles set status = (case when p_suspended then 'suspended' else 'active' end)::public.account_status
    where id = p_user_id and status in ('active', 'suspended');
  if not found then perform public.raise_app_error('user_not_found'); end if;
  insert into public.moderation_actions (moderator_user_id, action, target_type, target_id, reason)
  values (v_staff, case when p_suspended then 'user_suspend' else 'user_unsuspend' end, 'user', p_user_id, p_reason);
  perform public.write_audit(case when p_suspended then 'moderation.user_suspended' else 'moderation.user_unsuspended' end,
    'profile', p_user_id, null, null, 'staff');
end;
$$;

create function public.moderation_resolve_report(p_report_id uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff uuid := public.require_staff();
begin
  if p_status not in ('reviewing', 'actioned', 'dismissed') then perform public.raise_app_error('invalid_status'); end if;
  update public.content_reports
     set status = p_status,
         resolved_at = case when p_status in ('actioned', 'dismissed') then now() end,
         resolved_by = case when p_status in ('actioned', 'dismissed') then v_staff end
   where id = p_report_id;
  if not found then perform public.raise_app_error('report_not_found'); end if;
  if p_status in ('actioned', 'dismissed') then
    insert into public.moderation_actions (moderator_user_id, action, target_type, target_id, report_id, reason)
    values (v_staff, case p_status when 'actioned' then 'report_action' else 'report_dismiss' end, 'report', p_report_id, p_report_id, p_reason);
  end if;
end;
$$;

-- SERVICE ROLE ONLY. Executes a deletion request: removes personal data,
-- anonymizes the football profile, keeps audit/moderation facts. Returns the
-- storage objects the caller must delete afterwards. Idempotent.
create function public.account_process_deletion(p_request_id uuid)
returns table (bucket text, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.account_deletion_requests;
  v_player_id uuid;
begin
  select * into v_req from public.account_deletion_requests where id = p_request_id for update;
  if not found then perform public.raise_app_error('request_not_found'); end if;
  if v_req.status = 'completed' or v_req.user_id is null then return; end if;
  if v_req.status = 'cancelled' then perform public.raise_app_error('request_cancelled'); end if;

  update public.account_deletion_requests set status = 'processing' where id = p_request_id;
  select id into v_player_id from public.player_profiles where user_id = v_req.user_id;

  update public.media_assets set status = 'deleted', deleted_at = coalesce(deleted_at, now())
    where owner_user_id = v_req.user_id;

  if v_player_id is not null then
    update public.player_clips set deleted_at = coalesce(deleted_at, now()), visibility = 'private', title = null, identification_note = null
      where player_profile_id = v_player_id;
    update public.guardian_consents set revoked_at = coalesce(revoked_at, now())
      where player_profile_id = v_player_id and revoked_at is null;
    update public.guardian_relationships set status = 'revoked', revoked_at = coalesce(revoked_at, now()), invite_token_hash = null
      where player_profile_id = v_player_id and status in ('pending', 'active');
    update public.player_profiles
       set user_id = null,
           display_name = 'Profilo rimosso',
           slug = 'removed-' || replace(id::text, '-', ''),
           height_cm = null, current_club_display = null, shirt_number = null, bio = null,
           avatar_media_id = null, secondary_roles = '{}', visibility = 'private',
           deleted_at = coalesce(deleted_at, now())
     where id = v_player_id;
  end if;

  -- Guardian side: relationships this user held as guardian are revoked.
  update public.guardian_consents set revoked_at = coalesce(revoked_at, now())
    where guardian_user_id = v_req.user_id and revoked_at is null;
  update public.guardian_relationships set status = 'revoked', revoked_at = coalesce(revoked_at, now())
    where guardian_user_id = v_req.user_id and status = 'active';

  delete from public.account_private_data where user_id = v_req.user_id;
  delete from public.user_blocks where blocker_user_id = v_req.user_id;
  update public.profiles set status = 'deleted' where id = v_req.user_id;
  update public.account_deletion_requests set status = 'completed', processed_at = now() where id = p_request_id;

  insert into public.moderation_actions (moderator_user_id, action, target_type, target_id, reason)
  values (null, 'account_deletion_processed', 'user', v_req.user_id, 'user_request');
  insert into public.audit_log (actor_user_id, actor_role, action, entity_type, entity_id)
  values (null, 'system', 'account.deletion_processed', 'profile', v_req.user_id);

  return query select m.bucket, m.storage_path from public.media_assets m where m.owner_user_id = v_req.user_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS + grants
-- -----------------------------------------------------------------------------

alter table public.user_blocks enable row level security;
alter table public.content_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.account_deletion_requests enable row level security;
revoke all on public.user_blocks, public.content_reports, public.moderation_actions, public.account_deletion_requests
  from anon, authenticated;

grant select, delete on public.user_blocks to authenticated;
create policy user_blocks_own_select on public.user_blocks for select to authenticated
  using (blocker_user_id = (select auth.uid()));
create policy user_blocks_own_delete on public.user_blocks for delete to authenticated
  using (blocker_user_id = (select auth.uid()));

grant select (id, target_type, target_id, reason, status, created_at) on public.content_reports to authenticated;
create policy content_reports_select on public.content_reports for select to authenticated
  using (reporter_user_id = (select auth.uid()) or (select public.is_platform_staff()));

grant select on public.moderation_actions to authenticated;
create policy moderation_actions_staff on public.moderation_actions for select to authenticated
  using ((select public.is_platform_staff()));

grant select on public.account_deletion_requests to authenticated;
create policy account_deletion_select on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_platform_staff()));

grant execute on function public.media_playback_target(uuid) to anon, authenticated;
grant execute on function public.report_content(text, uuid, text, text, uuid) to authenticated;
grant execute on function public.block_player(uuid) to authenticated;
grant execute on function public.unblock_player(uuid) to authenticated;
grant execute on function public.my_blocked_players() to authenticated;
grant execute on function public.account_request_deletion(text) to authenticated;
grant execute on function public.moderation_decide_media(uuid, text, text, uuid) to authenticated;
grant execute on function public.moderation_set_profile_hidden(uuid, boolean, text, uuid) to authenticated;
grant execute on function public.moderation_set_user_suspended(uuid, boolean, text) to authenticated;
grant execute on function public.moderation_resolve_report(uuid, text, text) to authenticated;
grant execute on function public.account_process_deletion(uuid) to service_role;
