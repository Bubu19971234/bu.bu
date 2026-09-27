import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { type Tx, withTx } from './db';

type Player = Awaited<ReturnType<Tx['createPlayer']>>;

async function createUpload(tx: Tx, player: Player, opts: { kind?: string; mime?: string; durationMs?: number | null; op?: string } = {}) {
  const [{ r }] = (await tx.as(
    { userId: player.id },
    'select public.media_create_upload($1, $2, 1000000, $3, $4::uuid) as r',
    [opts.kind ?? 'player_clip', opts.mime ?? 'video/mp4', opts.durationMs === undefined ? 30_000 : opts.durationMs, opts.op ?? randomUUID()],
  )) as [{ r: { media_id: string; bucket: string; path: string; created: boolean } }];
  return r;
}

/** Simulates the Storage upload through the same RLS policy the API enforces. */
async function uploadObject(tx: Tx, player: Player, bucket: string, path: string) {
  await tx.as({ userId: player.id }, 'insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)', [bucket, path, player.id]);
}

async function processed(tx: Tx, mediaId: string, durationMs: number, mime = 'video/mp4') {
  await tx.as('service_role', 'select * from public.media_begin_processing($1)', [mediaId]);
  const [{ s }] = (await tx.as('service_role', 'select public.media_record_probe($1, $2, 1000000, $3) as s', [mediaId, mime, durationMs])) as [{ s: string }];
  return s;
}

describe('media & clips', () => {
  it('rejects declared clips over 60 seconds and disallowed MIME types', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      await expect(createUpload(tx, p, { durationMs: 60_001 })).rejects.toThrow(/duration_exceeded/);
      await expect(createUpload(tx, p, { durationMs: null })).rejects.toThrow(/duration_missing/);
      await expect(createUpload(tx, p, { mime: 'video/x-msvideo' })).rejects.toThrow(/mime_not_allowed/);
      await expect(createUpload(tx, p, { kind: 'avatar', mime: 'image/gif', durationMs: null })).rejects.toThrow(/mime_not_allowed/);
    }));

  it('server-measured duration over 60 s is rejected even if the client lied', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const up = await createUpload(tx, p, { durationMs: 20_000 });
      await uploadObject(tx, p, up.bucket, up.path);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [up.media_id]);
      expect(await processed(tx, up.media_id, 75_000)).toBe('rejected');
      const [{ reason }] = (await tx.admin('select rejection_reason as reason from public.media_assets where id = $1', [up.media_id])) as [{ reason: string }];
      expect(reason).toBe('duration_exceeded');
      // Even a direct write cannot put an over-limit clip into review.
      await expect(
        tx.admin(`update public.media_assets set status = 'pending_moderation', verified_duration_ms = 61000 where id = $1`, [up.media_id]),
      ).rejects.toThrow(/media_assets_player_clip_duration/);
    }));

  it('server-sniffed MIME that is not allowed is rejected', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const up = await createUpload(tx, p);
      await uploadObject(tx, p, up.bucket, up.path);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [up.media_id]);
      expect(await processed(tx, up.media_id, 10_000, 'text/html')).toBe('rejected');
    }));

  it('storage accepts uploads only into a reserved path of the same user', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const other = await tx.createPlayer(tx.dobForAge(20));
      const up = await createUpload(tx, p);
      await expect(uploadObject(tx, other, up.bucket, up.path)).rejects.toThrow(/row-level security/);
      await expect(uploadObject(tx, p, up.bucket, `u/${p.id}/player_clip/${randomUUID()}.mp4`)).rejects.toThrow(/row-level security/);
      await uploadObject(tx, p, up.bucket, up.path);
    }));

  it('retries do not duplicate logical records', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const op = randomUUID();
      const a = await createUpload(tx, p, { op });
      const b = await createUpload(tx, p, { op });
      expect(b.media_id).toBe(a.media_id);
      expect(b.created).toBe(false);
      await uploadObject(tx, p, a.bucket, a.path);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [a.media_id]);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [a.media_id]);
      expect(await processed(tx, a.media_id, 30_000)).toBe('pending_moderation');
      expect(await processed(tx, a.media_id, 30_000)).toBe('pending_moderation');
      const create = `select public.clip_create($1, 'dribbling', 'Skill', 'numero 10 maglia bianca') as id`;
      const [c1] = await tx.as({ userId: p.id }, create, [a.media_id]);
      const [c2] = await tx.as({ userId: p.id }, create, [a.media_id]);
      expect(c1!.id).toBe(c2!.id);
      const [{ n }] = (await tx.admin('select count(*)::int as n from public.player_clips where player_profile_id = $1', [p.playerId])) as [{ n: number }];
      expect(n).toBe(1);
    }));

  it('upload completion requires the object to exist', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const up = await createUpload(tx, p);
      expect(await tx.fails({ userId: p.id }, 'select public.media_complete_upload($1)', [up.media_id])).toMatch(/object_missing/);
    }));

  it('unpublished clips are not publicly accessible; published+public ones are', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const staff = await tx.createUser();
      await tx.admin(`insert into public.platform_staff (user_id, role) values ($1, 'moderator')`, [staff.id]);
      await tx.as({ userId: p.id }, `update public.player_profiles set visibility = 'public' where id = $1`, [p.playerId]);
      const up = await createUpload(tx, p);
      await uploadObject(tx, p, up.bucket, up.path);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [up.media_id]);
      await processed(tx, up.media_id, 30_000);
      const [{ id: clipId }] = (await tx.as({ userId: p.id }, `select public.clip_create($1, 'passing', null, null) as id`, [up.media_id])) as [{ id: string }];
      await tx.as({ userId: p.id }, `update public.player_clips set visibility = 'public' where id = $1`, [clipId]);

      const target = 'select * from public.media_playback_target($1)';
      expect(await tx.as('anon', target, [up.media_id])).toEqual([]);
      expect(await tx.as({ userId: p.id }, target, [up.media_id])).toHaveLength(1);
      expect(await tx.fails('anon', 'select * from public.player_clips')).toMatch(/permission denied/);

      const stranger = await tx.createUser();
      expect(await tx.fails({ userId: stranger.id }, `select public.moderation_decide_media($1, 'published', null)`, [up.media_id])).toMatch(/forbidden/);
      await tx.as({ userId: staff.id }, `select public.moderation_decide_media($1, 'published', 'ok')`, [up.media_id]);
      expect(await tx.as('anon', target, [up.media_id])).toHaveLength(1);
      const [{ p: pub }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [p.slug])) as [{ p: { clips: unknown[] } }];
      expect(pub.clips).toHaveLength(1);

      // Blocked viewers lose access.
      const viewer = await tx.createUser();
      await tx.as({ userId: viewer.id }, 'select public.block_player($1)', [p.playerId]);
      expect(await tx.as({ userId: viewer.id }, target, [up.media_id])).toEqual([]);
      const [{ p: blocked }] = (await tx.as({ userId: viewer.id }, 'select public.get_public_player_profile($1) as p', [p.slug])) as [{ p: unknown }];
      expect(blocked).toBeNull();
    }));

  it('enforces the active clip limit', () =>
    withTx(async (tx) => {
      await tx.admin(`update public.app_config set value = '1' where key = 'media.player_clip.max_active'`);
      const p = await tx.createPlayer(tx.dobForAge(20));
      const up = await createUpload(tx, p);
      await uploadObject(tx, p, up.bucket, up.path);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [up.media_id]);
      await processed(tx, up.media_id, 10_000);
      await tx.as({ userId: p.id }, `select public.clip_create($1, 'other', null, null)`, [up.media_id]);
      await expect(createUpload(tx, p)).rejects.toThrow(/clip_limit_reached/);
    }));
});
