import { type PlayerOnboardingInput, type PlayerProfileUpdateInput, playerOnboardingSchema, playerProfileUpdateSchema } from '@ftn/validation';
import type { DbClient } from '../client';
import type { MyPlayerStatus, PlayerProfileRow, PlayerProfileUpdate, PublicPlayerProfile } from '../database.types';
import { AppError, unwrap, unwrapMaybe } from '../errors';

const MY_PROFILE_COLUMNS =
  'id, slug, display_name, birth_year, height_cm, dominant_foot, preferred_role, secondary_roles, current_club_display, shirt_number, bio, avatar_media_id, visibility, verification_status, moderation_status, version, created_at, updated_at';

export type MyPlayerProfile = Omit<PlayerProfileRow, 'user_id' | 'deleted_at'>;

export function createPlayerService(db: DbClient) {
  const update = async (profileId: string, expectedVersion: number, patch: PlayerProfileUpdate): Promise<MyPlayerProfile> => {
    const { data, error } = await db
      .from('player_profiles')
      .update(patch)
      .eq('id', profileId)
      .eq('version', expectedVersion)
      .select(MY_PROFILE_COLUMNS)
      .maybeSingle();
    if (error) throw new AppError('unknown', error.message, error);
    // Zero rows: someone else changed the record (or it is not ours).
    if (!data) throw new AppError('version_conflict');
    return data as MyPlayerProfile;
  };

  return {
    async createProfile(input: PlayerOnboardingInput) {
      const v = playerOnboardingSchema.parse(input);
      return unwrap(
        await db.rpc('player_onboard', {
          p_display_name: v.displayName,
          p_date_of_birth: v.dateOfBirth,
          p_height_cm: v.heightCm,
          p_dominant_foot: v.dominantFoot,
          p_preferred_role: v.preferredRole,
          p_secondary_roles: v.secondaryRoles,
          p_current_club_display: v.currentClubDisplay,
          p_shirt_number: v.shirtNumber,
        }),
      );
    },

    async getMyProfile(): Promise<MyPlayerProfile | null> {
      const id = unwrapMaybe(await db.rpc('my_player_profile_id'));
      if (!id) return null;
      const data = unwrapMaybe(await db.from('player_profiles').select(MY_PROFILE_COLUMNS).eq('id', id).maybeSingle());
      return data as MyPlayerProfile | null;
    },

    async getMyStatus(): Promise<MyPlayerStatus | null> {
      return unwrapMaybe(await db.rpc('my_player_status'));
    },

    /** Optimistic update: fails with `version_conflict` instead of overwriting. */
    async updateProfile(profileId: string, expectedVersion: number, input: PlayerProfileUpdateInput) {
      const v = playerProfileUpdateSchema.parse(input);
      const patch: PlayerProfileUpdate = {};
      if (v.displayName !== undefined) patch.display_name = v.displayName;
      if (v.heightCm !== undefined) patch.height_cm = v.heightCm;
      if (v.dominantFoot !== undefined) patch.dominant_foot = v.dominantFoot;
      if (v.preferredRole !== undefined) patch.preferred_role = v.preferredRole;
      if (v.secondaryRoles !== undefined) patch.secondary_roles = v.secondaryRoles;
      if (v.currentClubDisplay !== undefined) patch.current_club_display = v.currentClubDisplay;
      if (v.shirtNumber !== undefined) patch.shirt_number = v.shirtNumber;
      if (v.bio !== undefined) patch.bio = v.bio;
      return update(profileId, expectedVersion, patch);
    },

    async updateVisibility(profileId: string, expectedVersion: number, visibility: 'private' | 'public') {
      return update(profileId, expectedVersion, { visibility });
    },

    async setAvatar(profileId: string, expectedVersion: number, mediaId: string | null) {
      return update(profileId, expectedVersion, { avatar_media_id: mediaId });
    },

    async getPublicProfile(slug: string): Promise<PublicPlayerProfile | null> {
      return unwrapMaybe(await db.rpc('get_public_player_profile', { p_slug: slug }));
    },
  };
}
