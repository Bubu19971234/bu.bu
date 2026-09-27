import { describe, expect, it } from 'vitest';
import { withTx } from './db';

describe('player profiles & privacy', () => {
  it('anon cannot read player tables or private data', () =>
    withTx(async (tx) => {
      await tx.createPlayer(tx.dobForAge(20));
      expect(await tx.fails('anon', 'select * from public.player_profiles')).toMatch(/permission denied/);
      expect(await tx.fails('anon', 'select * from public.account_private_data')).toMatch(/permission denied/);
      expect(await tx.fails('anon', 'select * from public.guardian_relationships')).toMatch(/permission denied/);
    }));

  it('authenticated users only see their own private data', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      const b = await tx.createPlayer(tx.dobForAge(22));
      const rows = await tx.as({ userId: a.id }, 'select user_id from public.account_private_data');
      expect(rows).toEqual([{ user_id: a.id }]);
      const profiles = await tx.as({ userId: a.id }, 'select id from public.player_profiles');
      expect(profiles.map((r) => r.id)).toEqual([a.playerId]);
      expect(profiles.map((r) => r.id)).not.toContain(b.playerId);
    }));

  it('player A cannot edit player B', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      const b = await tx.createPlayer(tx.dobForAge(20));
      const updated = await tx.as({ userId: a.id }, `update public.player_profiles set display_name = 'Hacked' where id = $1 returning id`, [
        b.playerId,
      ]);
      expect(updated).toEqual([]);
      const [row] = await tx.admin('select display_name from public.player_profiles where id = $1', [b.playerId]);
      expect(row!.display_name).toBe('Test Player');
    }));

  it('player cannot self-set protected columns', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      for (const col of ["verification_status = 'club_verified'", "moderation_status = 'ok'", 'user_id = null', 'version = 99', "slug = 'x-custom'"]) {
        expect(await tx.fails({ userId: a.id }, `update public.player_profiles set ${col} where id = $1`, [a.playerId])).toMatch(
          /permission denied/,
        );
      }
      expect(
        await tx.fails({ userId: a.id }, `insert into public.player_profiles (user_id, slug, display_name, birth_year, dominant_foot, preferred_role) values ($1, 'abc-def', 'X', 2000, 'left', 'ST')`, [a.id]),
      ).toMatch(/permission denied/);
      expect(await tx.fails({ userId: a.id }, `update public.account_private_data set date_of_birth = '1990-01-01'`)).toMatch(
        /permission denied/,
      );
    }));

  it('onboarding is idempotent, enforces minimum age and immutable DOB', () =>
    withTx(async (tx) => {
      const user = await tx.createUser();
      const call = (dob: string) =>
        tx.as({ userId: user.id }, `select public.player_onboard('Mario Rossi', $1::date, null, 'left', 'ST', '{}', null, null) as r`, [dob]);
      expect(await tx.fails({ userId: user.id }, `select public.player_onboard('Kid', $1::date, null, 'left', 'ST', '{}', null, null)`, [tx.dobForAge(12)])).toMatch(
        /under_minimum_age/,
      );
      const [first] = await call(tx.dobForAge(15));
      const [second] = await call(tx.dobForAge(15));
      expect(first!.r.created).toBe(true);
      expect(first!.r.requires_guardian).toBe(true);
      expect(second!.r.created).toBe(false);
      expect(second!.r.player_profile_id).toBe(first!.r.player_profile_id);
      const [{ n }] = (await tx.admin('select count(*)::int as n from public.player_profiles where user_id = $1', [user.id])) as [{ n: number }];
      expect(n).toBe(1);
      expect(await tx.fails({ userId: user.id }, `select public.account_set_date_of_birth('2000-01-01')`)).toMatch(/date_of_birth_already_set/);
    }));

  it('optimistic concurrency: stale version updates affect zero rows', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      const [{ version }] = (await tx.as({ userId: a.id }, 'select version from public.player_profiles where id = $1', [a.playerId])) as [{ version: number }];
      const first = await tx.as({ userId: a.id }, `update public.player_profiles set bio = 'one' where id = $1 and version = $2 returning version`, [a.playerId, version]);
      expect(first).toEqual([{ version: version + 1 }]);
      const stale = await tx.as({ userId: a.id }, `update public.player_profiles set bio = 'two' where id = $1 and version = $2 returning version`, [a.playerId, version]);
      expect(stale).toEqual([]);
    }));

  it('public profile exposes only whitelisted fields and hides private profiles', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      const hidden = await tx.as('anon', 'select public.get_public_player_profile($1) as p', [a.slug]);
      expect(hidden[0]!.p).toBeNull();
      await tx.as({ userId: a.id }, `update public.player_profiles set visibility = 'public' where id = $1`, [a.playerId]);
      const [{ p }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [a.slug])) as [{ p: Record<string, unknown> }];
      expect(Object.keys(p).sort()).toEqual(
        [
          'avatar_media_id', 'bio', 'birth_year', 'clips', 'current_club_display', 'display_name', 'dominant_foot', 'height_cm', 'id',
          'preferred_role', 'rating', 'secondary_roles', 'shirt_number', 'slug', 'updated_at', 'verification_status',
        ].sort(),
      );
      const serialized = JSON.stringify(p);
      expect(serialized).not.toContain(a.id);
      expect(serialized).not.toContain(a.email);
      expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T?[^"]*"?,"?date_of_birth/);
    }));

  it('suspended or deletion-requested accounts are not public', () =>
    withTx(async (tx) => {
      const a = await tx.createPlayer(tx.dobForAge(20));
      await tx.as({ userId: a.id }, `update public.player_profiles set visibility = 'public' where id = $1`, [a.playerId]);
      await tx.as({ userId: a.id }, `select public.account_request_deletion('bye')`);
      const [{ p }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [a.slug])) as [{ p: unknown }];
      expect(p).toBeNull();
    }));
});
