import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { adminCommitted, runCommitted } from './db';

// These tests commit data on separate connections to exercise real races.
// The test database is recreated on every run.
describe('concurrent writes', () => {
  it('parallel onboarding calls create exactly one profile', async () => {
    const [{ id }] = (await adminCommitted(`insert into auth.users (email, email_confirmed_at) values ($1, now()) returning id`, [
      `${randomUUID()}@example.test`,
    ])) as [{ id: string }];
    const call = () =>
      runCommitted<{ r: { player_profile_id: string } }>(
        id,
        `select public.player_onboard('Race Test', '2000-01-01', null, 'right', 'CB', '{}', null, null) as r`,
      );
    const results = await Promise.all([call(), call(), call(), call()]);
    const ids = new Set(results.map((rows) => rows[0]!.r.player_profile_id));
    expect(ids.size).toBe(1);
    const [{ n }] = (await adminCommitted('select count(*)::int as n from public.player_profiles where user_id = $1', [id])) as [{ n: number }];
    expect(n).toBe(1);
  });

  it('parallel upload-session retries with one operation id create one media row', async () => {
    const [{ id }] = (await adminCommitted(`insert into auth.users (email, email_confirmed_at) values ($1, now()) returning id`, [
      `${randomUUID()}@example.test`,
    ])) as [{ id: string }];
    await runCommitted(id, `select public.player_onboard('Race Two', '2000-01-01', null, 'right', 'CB', '{}', null, null)`);
    const op = randomUUID();
    const call = () =>
      runCommitted<{ r: { media_id: string } }>(id, `select public.media_create_upload('player_clip', 'video/mp4', 1000, 5000, $1::uuid) as r`, [op]);
    const results = await Promise.all([call(), call(), call()]);
    expect(new Set(results.map((rows) => rows[0]!.r.media_id)).size).toBe(1);
  });
});
