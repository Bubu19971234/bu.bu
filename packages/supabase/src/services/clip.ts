import { type CreateClipInput, createClipSchema } from '@ftn/validation';
import type { DbClient } from '../client';
import type { MediaStatusDb, PlayerClipRow } from '../database.types';
import { AppError, unwrap } from '../errors';

export type MyClip = PlayerClipRow & {
  media: { status: MediaStatusDb; verified_duration_ms: number | null; rejection_reason: string | null } | null;
};

export function createClipService(db: DbClient) {
  return {
    /** Idempotent per media: retrying returns the same clip id. */
    async createClip(input: CreateClipInput): Promise<string> {
      const v = createClipSchema.parse(input);
      return unwrap(
        await db.rpc('clip_create', {
          p_media_id: v.mediaId,
          p_category: v.category,
          p_title: v.title,
          p_identification_note: v.identificationNote,
        }),
      );
    },

    async listPlayerClips(playerProfileId: string, cursor?: { createdAt: string; id: string }, limit = 20): Promise<MyClip[]> {
      let q = db
        .from('player_clips')
        .select('id, player_profile_id, media_id, category, title, identification_note, visibility, version, created_at, updated_at, deleted_at, media:media_assets(status, verified_duration_ms, rejection_reason)')
        .eq('player_profile_id', playerProfileId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);
      if (cursor) q = q.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
      return unwrap(await q) as unknown as MyClip[];
    },

    /** Player intent to show the clip publicly; effective only once moderated and allowed. */
    async publishClip(clipId: string, expectedVersion: number, visible = true) {
      const { data, error } = await db
        .from('player_clips')
        .update({ visibility: visible ? 'public' : 'private' })
        .eq('id', clipId)
        .eq('version', expectedVersion)
        .select('id, version, visibility')
        .maybeSingle();
      if (error) throw new AppError('unknown', error.message, error);
      if (!data) throw new AppError('version_conflict');
      return data;
    },

    async deleteClip(clipId: string) {
      unwrap(await db.rpc('clip_delete', { p_clip_id: clipId }));
    },
  };
}
