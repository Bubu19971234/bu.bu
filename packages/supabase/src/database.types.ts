/**
 * Database types for the Supabase client.
 *
 * Hand-maintained to mirror supabase/migrations until the Supabase CLI type
 * generator is wired into CI (`pnpm db:types`, see docs/IMPLEMENTATION_PLAN.md).
 * Keep in sync with every migration that changes exposed tables/functions.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;

export type AccountStatus = 'active' | 'suspended' | 'deletion_requested' | 'deleted';
export type MediaStatusDb =
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'pending_moderation'
  | 'published'
  | 'rejected'
  | 'failed'
  | 'deleted';

export type ProfileRow = {
  id: string;
  status: AccountStatus;
  locale: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PlayerProfileRow = {
  id: string;
  user_id: string | null;
  slug: string;
  display_name: string;
  birth_year: number;
  height_cm: number | null;
  dominant_foot: 'left' | 'right' | 'both';
  preferred_role: string;
  secondary_roles: string[];
  current_club_display: string | null;
  shirt_number: number | null;
  bio: string | null;
  avatar_media_id: string | null;
  visibility: 'private' | 'public';
  verification_status: 'unverified' | 'club_verified';
  moderation_status: 'ok' | 'hidden';
  version: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

/** Columns a player may update directly (column-level GRANT). */
export type PlayerProfileUpdate = Partial<
  Pick<
    PlayerProfileRow,
    | 'display_name'
    | 'height_cm'
    | 'dominant_foot'
    | 'preferred_role'
    | 'secondary_roles'
    | 'current_club_display'
    | 'shirt_number'
    | 'bio'
    | 'visibility'
    | 'avatar_media_id'
  >
>;

export type GuardianRelationshipRow = {
  id: string;
  player_profile_id: string;
  guardian_user_id: string | null;
  invited_email: string;
  relationship_type: 'parent' | 'legal_guardian';
  status: 'pending' | 'active' | 'revoked' | 'expired' | 'declined';
  verification_state: 'unverified' | 'email_matched' | 'document_verified';
  invite_expires_at: Timestamp | null;
  accepted_at: Timestamp | null;
  revoked_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuardianConsentRow = {
  id: string;
  relationship_id: string;
  player_profile_id: string;
  guardian_user_id: string | null;
  consent_version: string;
  terms_version: string;
  privacy_version: string;
  scopes: string[];
  granted_at: Timestamp;
  revoked_at: Timestamp | null;
  revoked_by_user_id: string | null;
  created_at: Timestamp;
};

export type MediaAssetRow = {
  id: string;
  owner_user_id: string | null;
  kind: 'avatar' | 'player_clip';
  status: MediaStatusDb;
  bucket: string;
  storage_path: string;
  processed_path: string | null;
  declared_mime: string;
  declared_size_bytes: number;
  declared_duration_ms: number | null;
  verified_mime: string | null;
  verified_size_bytes: number | null;
  verified_duration_ms: number | null;
  rejection_reason: string | null;
  client_operation_id: string;
  moderated_by: string | null;
  moderated_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

export type PlayerClipRow = {
  id: string;
  player_profile_id: string;
  media_id: string;
  category: string;
  title: string | null;
  identification_note: string | null;
  visibility: 'private' | 'public';
  version: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

export type PlayerClipUpdate = Partial<Pick<PlayerClipRow, 'category' | 'title' | 'identification_note' | 'visibility'>>;

export type AiAnalysisRunRow = {
  id: string;
  player_profile_id: string;
  clip_id: string | null;
  provider: string;
  model: string;
  model_version: string;
  prompt_version: string;
  schema_version: string;
  input_media_ids: string[];
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  summary: string | null;
  limitations: string[];
  missing_evidence: string[];
  error: string | null;
  idempotency_key: string;
  requested_by: string | null;
  created_at: Timestamp;
  completed_at: Timestamp | null;
};

export type AiObservationRow = {
  id: string;
  run_id: string;
  player_profile_id: string;
  attribute: string;
  score: number | null;
  confidence: number;
  evidence_count: number;
  source_type: string;
  limitations: string[];
  evidence: Json;
  created_at: Timestamp;
};

export type PlayerRatingSnapshotRow = {
  id: string;
  player_profile_id: string;
  version: number;
  overall: number | null;
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physical: number | null;
  confidence: number;
  attribute_details: Json;
  evidence_coverage: Json;
  generated_by: 'ai' | 'hybrid' | 'manual';
  analysis_run_id: string | null;
  created_at: Timestamp;
};

export type ContentReportRow = {
  id: string;
  reporter_user_id: string | null;
  target_type: 'player_profile' | 'clip' | 'user';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewing' | 'actioned' | 'dismissed';
  client_operation_id: string;
  created_at: Timestamp;
  resolved_at: Timestamp | null;
  resolved_by: string | null;
};

export type AccountDeletionRequestRow = {
  id: string;
  user_id: string | null;
  status: 'requested' | 'processing' | 'completed' | 'cancelled';
  reason: string | null;
  requested_at: Timestamp;
  processed_at: Timestamp | null;
  processed_by: string | null;
};

export type AppConfigRow = {
  key: string;
  value: Json;
  description: string | null;
  updated_at: Timestamp;
};

export type PublicClip = {
  id: string;
  media_id: string;
  category: string;
  title: string | null;
  duration_ms: number | null;
  created_at: Timestamp;
};

export type PublicRating = {
  version: number;
  overall: number | null;
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physical: number | null;
  confidence: number;
  attribute_details: Json;
  generated_by: 'ai' | 'hybrid' | 'manual';
  created_at: Timestamp;
};

/** Whitelisted public profile returned by get_public_player_profile(). */
export type PublicPlayerProfile = {
  id: string;
  slug: string;
  display_name: string;
  birth_year: number;
  height_cm: number | null;
  dominant_foot: 'left' | 'right' | 'both';
  preferred_role: string;
  secondary_roles: string[];
  current_club_display: string | null;
  shirt_number: number | null;
  bio: string | null;
  verification_status: 'unverified' | 'club_verified';
  avatar_media_id: string | null;
  rating: PublicRating | null;
  clips: PublicClip[];
  updated_at: Timestamp;
};

export type MyPlayerStatus = {
  player_profile_id: string;
  is_minor: boolean;
  guardian_consent_scopes: string[];
  is_public: boolean;
  visibility: 'private' | 'public';
  moderation_status: 'ok' | 'hidden';
};

/** Direct inserts are never allowed from clients (RPCs only). */
type Table<Row, Update = Record<string, never>> = {
  Row: Row;
  Insert: Record<string, never>;
  Update: Update;
  Relationships: [];
};

type Fn<Args, Returns> = { Args: Args; Returns: Returns };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      player_profiles: Table<PlayerProfileRow, PlayerProfileUpdate>;
      guardian_relationships: Table<GuardianRelationshipRow>;
      guardian_consents: Table<GuardianConsentRow>;
      media_assets: Table<MediaAssetRow>;
      player_clips: Table<PlayerClipRow, PlayerClipUpdate>;
      ai_analysis_runs: Table<AiAnalysisRunRow>;
      ai_observations: Table<AiObservationRow>;
      player_rating_snapshots: Table<PlayerRatingSnapshotRow>;
      content_reports: Table<ContentReportRow>;
      account_deletion_requests: Table<AccountDeletionRequestRow>;
      app_config: Table<AppConfigRow>;
      platform_staff: Table<{ user_id: string; role: 'admin' | 'moderator'; granted_by: string | null; created_at: Timestamp }>;
      user_blocks: Table<{ blocker_user_id: string; blocked_user_id: string; created_at: Timestamp }>;
    };
    Views: Record<string, never>;
    Functions: {
      player_onboard: Fn<
        {
          p_display_name: string;
          p_date_of_birth: string;
          p_height_cm: number | null;
          p_dominant_foot: string;
          p_preferred_role: string;
          p_secondary_roles: string[];
          p_current_club_display: string | null;
          p_shirt_number: number | null;
        },
        { player_profile_id: string; slug: string; requires_guardian: boolean; created: boolean }
      >;
      my_player_status: Fn<Record<string, never>, MyPlayerStatus | null>;
      my_player_profile_id: Fn<Record<string, never>, string | null>;
      account_set_date_of_birth: Fn<{ p_date_of_birth: string }, undefined>;
      get_public_player_profile: Fn<{ p_slug: string }, PublicPlayerProfile | null>;
      guardian_request_create: Fn<{ p_guardian_email: string; p_relationship_type: string }, string>;
      guardian_issue_invite_token: Fn<
        { p_relationship_id: string },
        { token: string; invited_email: string; player_display_name: string; expires_at: Timestamp }[]
      >;
      guardian_invitation_preview: Fn<
        { p_token: string },
        {
          relationship_id: string;
          player_display_name: string;
          player_birth_year: number;
          relationship_type: string;
          status: string;
          expired: boolean;
          email_matches: boolean;
          consent_version: string;
        } | null
      >;
      guardian_accept: Fn<
        { p_token: string; p_consent_version: string; p_terms_version: string; p_privacy_version: string; p_scopes: string[] },
        { relationship_id: string; consent_id: string; created: boolean }
      >;
      guardian_revoke_consent: Fn<{ p_relationship_id: string }, undefined>;
      guardian_grant_consent: Fn<
        { p_relationship_id: string; p_consent_version: string; p_terms_version: string; p_privacy_version: string; p_scopes: string[] },
        string
      >;
      media_create_upload: Fn<
        { p_kind: string; p_mime: string; p_size_bytes: number; p_duration_ms: number | null; p_client_operation_id: string },
        { media_id: string; bucket: string; path: string; status: MediaStatusDb; created: boolean }
      >;
      media_complete_upload: Fn<{ p_media_id: string }, MediaStatusDb>;
      media_begin_processing: Fn<
        { p_media_id: string },
        { id: string; kind: 'avatar' | 'player_clip'; status: MediaStatusDb; bucket: string; storage_path: string; owner_user_id: string | null }[]
      >;
      media_record_probe: Fn<
        {
          p_media_id: string;
          p_verified_mime: string | null;
          p_verified_size_bytes: number | null;
          p_verified_duration_ms: number | null;
          p_error?: string | null;
        },
        MediaStatusDb
      >;
      media_delete: Fn<{ p_media_id: string }, undefined>;
      media_playback_target: Fn<{ p_media_id: string }, { bucket: string; storage_path: string; mime: string }[]>;
      clip_create: Fn<{ p_media_id: string; p_category: string; p_title: string | null; p_identification_note: string | null }, string>;
      clip_delete: Fn<{ p_clip_id: string }, undefined>;
      report_content: Fn<
        { p_target_type: string; p_target_id: string; p_reason: string; p_details: string | null; p_client_operation_id: string },
        string
      >;
      block_player: Fn<{ p_player_profile_id: string }, undefined>;
      unblock_player: Fn<{ p_player_profile_id: string }, undefined>;
      my_blocked_players: Fn<Record<string, never>, { player_profile_id: string; display_name: string; blocked_at: Timestamp }[]>;
      account_request_deletion: Fn<{ p_reason: string | null }, string>;
      account_process_deletion: Fn<{ p_request_id: string }, { bucket: string; storage_path: string }[]>;
      is_platform_staff: Fn<Record<string, never>, boolean>;
      is_platform_admin: Fn<Record<string, never>, boolean>;
      moderation_decide_media: Fn<{ p_media_id: string; p_decision: string; p_reason: string | null; p_report_id?: string | null }, string>;
      moderation_set_profile_hidden: Fn<{ p_player_profile_id: string; p_hidden: boolean; p_reason: string | null; p_report_id?: string | null }, undefined>;
      moderation_set_user_suspended: Fn<{ p_user_id: string; p_suspended: boolean; p_reason: string | null }, undefined>;
      moderation_resolve_report: Fn<{ p_report_id: string; p_status: string; p_reason: string | null }, undefined>;
      ai_begin_run: Fn<
        {
          p_clip_id: string;
          p_provider: string;
          p_model: string;
          p_model_version: string;
          p_prompt_version: string;
          p_schema_version: string;
          p_requested_by: string;
        },
        { run_id: string; run_status: string; created: boolean }[]
      >;
      ai_complete_run: Fn<
        {
          p_run_id: string;
          p_observations: Json;
          p_summary: string;
          p_limitations: string[];
          p_missing_evidence: string[];
          p_snapshot: Json | null;
        },
        number | null
      >;
      ai_fail_run: Fn<{ p_run_id: string; p_error: string }, undefined>;
      idempotency_begin: Fn<
        { p_actor: string; p_action: string; p_key: string; p_request_hash: string },
        { id: string; outcome: 'new' | 'replay' | 'in_progress' | 'mismatch'; response: Json | null }[]
      >;
      idempotency_finish: Fn<{ p_id: string; p_status: string; p_response: Json | null }, undefined>;
    };
    Enums: { account_status: AccountStatus };
    CompositeTypes: Record<string, never>;
  };
};
