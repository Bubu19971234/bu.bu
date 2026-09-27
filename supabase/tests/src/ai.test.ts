import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { withTx } from './db';

describe('AI provenance', () => {
  it('runs are idempotent per clip/model/prompt and snapshots are versioned', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const [{ r }] = (await tx.as({ userId: p.id }, `select public.media_create_upload('player_clip', 'video/mp4', 1000, 20000, $1::uuid) as r`, [randomUUID()])) as [{ r: { media_id: string; bucket: string; path: string } }];
      await tx.as({ userId: p.id }, 'insert into storage.objects (bucket_id, name) values ($1, $2)', [r.bucket, r.path]);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [r.media_id]);
      await tx.as('service_role', 'select * from public.media_begin_processing($1)', [r.media_id]);
      await tx.as('service_role', `select public.media_record_probe($1, 'video/mp4', 1000, 20000)`, [r.media_id]);
      const [{ id: clipId }] = (await tx.as({ userId: p.id }, `select public.clip_create($1, 'shooting', null, null) as id`, [r.media_id])) as [{ id: string }];

      const begin = `select * from public.ai_begin_run($1, 'mock', 'mock-clip-analyzer', '1', 'mock-v1', 'clip-observations/v1', $2)`;
      const [run1] = await tx.as('service_role', begin, [clipId, p.id]);
      const [run2] = await tx.as('service_role', begin, [clipId, p.id]);
      expect(run1!.created).toBe(true);
      expect(run2!.created).toBe(false);
      expect(run2!.run_id).toBe(run1!.run_id);

      const obs = JSON.stringify([{ attribute: 'shooting', score: 70, confidence: 0.4, evidenceCount: 2, sourceType: 'player_selected_clips', limitations: ['mock_provider'] }]);
      const snap = JSON.stringify({ overall: null, shooting: 70, confidence: 0.33, attribute_details: { shooting: { status: 'rated' }, pace: { status: 'insufficient_data' } } });
      const complete = `select public.ai_complete_run($1, $2::jsonb, 'demo', '{mock_provider}', '{pace}', $3::jsonb) as v`;
      const [c1] = await tx.as('service_role', complete, [run1!.run_id, obs, snap]);
      const [c2] = await tx.as('service_role', complete, [run1!.run_id, obs, snap]);
      expect(c1!.v).toBe(1);
      expect(c2!.v).toBe(1);
      const rows = await tx.as({ userId: p.id }, 'select pace, shooting, overall from public.player_rating_snapshots');
      expect(rows).toEqual([{ pace: null, shooting: 70, overall: null }]);

      const stranger = await tx.createUser();
      expect(await tx.fails('service_role', begin, [clipId, stranger.id])).toMatch(/forbidden/);
    }));

  it('minors need the ai_analysis guardian scope', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(15));
      const [{ r }] = (await tx.as({ userId: p.id }, `select public.media_create_upload('player_clip', 'video/mp4', 1000, 20000, $1::uuid) as r`, [randomUUID()])) as [{ r: { media_id: string; bucket: string; path: string } }];
      await tx.as({ userId: p.id }, 'insert into storage.objects (bucket_id, name) values ($1, $2)', [r.bucket, r.path]);
      await tx.as({ userId: p.id }, 'select public.media_complete_upload($1)', [r.media_id]);
      await tx.as('service_role', `select public.media_record_probe($1, 'video/mp4', 1000, 20000)`, [r.media_id]);
      const [{ id: clipId }] = (await tx.as({ userId: p.id }, `select public.clip_create($1, 'shooting', null, null) as id`, [r.media_id])) as [{ id: string }];
      expect(
        await tx.fails('service_role', `select * from public.ai_begin_run($1, 'mock', 'm', '1', 'p', 's', $2)`, [clipId, p.id]),
      ).toMatch(/guardian_consent_required/);
    }));
});
