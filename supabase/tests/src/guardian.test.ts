import { describe, expect, it } from 'vitest';
import { type Tx, withTx } from './db';

const CONSENT = '2026-09-v1';

async function inviteGuardian(tx: Tx, minor: { id: string }, guardianEmail: string) {
  const [{ id }] = (await tx.as({ userId: minor.id }, `select public.guardian_request_create($1, 'parent') as id`, [guardianEmail])) as [{ id: string }];
  const [{ token }] = (await tx.as('service_role', 'select token from public.guardian_issue_invite_token($1)', [id])) as [{ token: string }];
  return { relationshipId: id, token };
}

const accept = (tx: Tx, userId: string, token: string, scopes = ['public_profile', 'public_clips', 'ai_analysis']) =>
  tx.as({ userId }, `select public.guardian_accept($1, $2, 'terms-v1', 'privacy-v1', $3::text[]) as r`, [token, CONSENT, scopes]);

describe('guardian workflow', () => {
  it('a minor cannot publish without guardian approval', () =>
    withTx(async (tx) => {
      const minor = await tx.createPlayer(tx.dobForAge(15));
      await tx.as({ userId: minor.id }, `update public.player_profiles set visibility = 'public' where id = $1`, [minor.playerId]);
      const [{ p }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [minor.slug])) as [{ p: unknown }];
      expect(p).toBeNull();
      const [{ s }] = (await tx.as({ userId: minor.id }, 'select public.my_player_status() as s')) as [{ s: { is_public: boolean; is_minor: boolean } }];
      expect(s.is_minor).toBe(true);
      expect(s.is_public).toBe(false);
    }));

  it('minor cannot self-enable guardian approval', () =>
    withTx(async (tx) => {
      const minor = await tx.createPlayer(tx.dobForAge(15));
      expect(
        await tx.fails({ userId: minor.id }, `insert into public.guardian_consents (relationship_id, player_profile_id, consent_version, terms_version, privacy_version, scopes) values (gen_random_uuid(), $1, 'x', 'x', 'x', '{public_profile}')`, [minor.playerId]),
      ).toMatch(/permission denied/);
      expect(
        await tx.fails({ userId: minor.id }, `update public.guardian_relationships set status = 'active'`),
      ).toMatch(/permission denied/);
      // Token issuance is service-role only; the minor never sees the token.
      const [{ id }] = (await tx.as({ userId: minor.id }, `select public.guardian_request_create('mum@example.test', 'parent') as id`)) as [{ id: string }];
      expect(await tx.fails({ userId: minor.id }, 'select * from public.guardian_issue_invite_token($1)', [id])).toMatch(/permission denied/);
      expect(await tx.fails({ userId: minor.id }, 'select invite_token_hash from public.guardian_relationships')).toMatch(/permission denied/);
      // Accepting with their own account is refused.
      const { token } = await inviteGuardian(tx, minor, 'other@example.test');
      expect(await tx.fails({ userId: minor.id }, `select public.guardian_accept($1, $2, 't', 'p', '{public_profile}')`, [token, CONSENT])).toMatch(
        /guardian_is_player|guardian_email_mismatch/,
      );
    }));

  it('guardian approval publishes; retry does not duplicate; revocation unpublishes', () =>
    withTx(async (tx) => {
      const minor = await tx.createPlayer(tx.dobForAge(15));
      await tx.as({ userId: minor.id }, `update public.player_profiles set visibility = 'public' where id = $1`, [minor.playerId]);
      const guardian = await tx.createUser({ email: 'parent@example.test' });
      const { relationshipId, token } = await inviteGuardian(tx, minor, 'Parent@Example.test');

      expect(await accept(tx, guardian.id, token).catch((e: Error) => e.message)).toMatch(/guardian_date_of_birth_required/);
      await tx.as({ userId: guardian.id }, `select public.account_set_date_of_birth($1::date)`, [tx.dobForAge(45)]);

      const [first] = await accept(tx, guardian.id, token);
      const [second] = await accept(tx, guardian.id, token);
      expect(first!.r.created).toBe(true);
      expect(second!.r.created).toBe(false);
      expect(second!.r.consent_id).toBe(first!.r.consent_id);

      const [{ n }] = (await tx.admin('select count(*)::int as n from public.guardian_consents where player_profile_id = $1', [minor.playerId])) as [{ n: number }];
      expect(n).toBe(1);
      const [{ r }] = (await tx.admin(`select count(*)::int as r from public.guardian_relationships where player_profile_id = $1 and status = 'active'`, [minor.playerId])) as [{ r: number }];
      expect(r).toBe(1);

      const [{ p }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [minor.slug])) as [{ p: { display_name: string } }];
      expect(p.display_name).toBe('Test Player');
      expect(JSON.stringify(p)).not.toContain('parent@example.test');

      await tx.as({ userId: guardian.id }, 'select public.guardian_revoke_consent($1)', [relationshipId]);
      const [{ p: after }] = (await tx.as('anon', 'select public.get_public_player_profile($1) as p', [minor.slug])) as [{ p: unknown }];
      expect(after).toBeNull();
      const [{ audit }] = (await tx.admin(`select count(*)::int as audit from public.guardian_consents where player_profile_id = $1 and revoked_at is not null`, [minor.playerId])) as [{ audit: number }];
      expect(audit).toBe(1);
    }));

  it('rejects minors, unconfirmed and mismatched emails as guardians', () =>
    withTx(async (tx) => {
      const minor = await tx.createPlayer(tx.dobForAge(14));
      const teen = await tx.createUser({ email: 'teen@example.test' });
      await tx.as({ userId: teen.id }, `select public.account_set_date_of_birth($1::date)`, [tx.dobForAge(16)]);
      const { token } = await inviteGuardian(tx, minor, 'teen@example.test');
      expect(await accept(tx, teen.id, token).catch((e: Error) => e.message)).toMatch(/guardian_not_adult/);

      const stranger = await tx.createUser({ email: 'stranger@example.test' });
      await tx.as({ userId: stranger.id }, `select public.account_set_date_of_birth($1::date)`, [tx.dobForAge(40)]);
      expect(await accept(tx, stranger.id, token).catch((e: Error) => e.message)).toMatch(/guardian_email_mismatch/);

      const unconfirmed = await tx.createUser({ email: 'late@example.test', confirmed: false });
      await tx.as({ userId: unconfirmed.id }, `select public.account_set_date_of_birth($1::date)`, [tx.dobForAge(40)]);
      const { token: t2 } = await inviteGuardian(tx, minor, 'late@example.test');
      expect(await accept(tx, unconfirmed.id, t2).catch((e: Error) => e.message)).toMatch(/guardian_email_unconfirmed/);
    }));

  it('guardian request retry returns the same pending relationship; adults do not need one', () =>
    withTx(async (tx) => {
      const minor = await tx.createPlayer(tx.dobForAge(15));
      const q = `select public.guardian_request_create('dad@example.test', 'parent') as id`;
      const [a] = await tx.as({ userId: minor.id }, q);
      const [b] = await tx.as({ userId: minor.id }, q);
      expect(a!.id).toBe(b!.id);
      const adult = await tx.createPlayer(tx.dobForAge(19));
      expect(await tx.fails({ userId: adult.id }, q)).toMatch(/guardian_not_required/);
    }));
});
