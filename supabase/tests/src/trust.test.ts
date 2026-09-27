import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { withTx } from './db';

describe('reports, blocks, deletion', () => {
  it('report retries are idempotent and reporters only see their own reports', () =>
    withTx(async (tx) => {
      const target = await tx.createPlayer(tx.dobForAge(20));
      const reporter = await tx.createUser();
      const op = randomUUID();
      const q = `select public.report_content('player_profile', $1, 'spam', 'details', $2::uuid) as id`;
      const [a] = await tx.as({ userId: reporter.id }, q, [target.playerId, op]);
      const [b] = await tx.as({ userId: reporter.id }, q, [target.playerId, op]);
      const [c] = await tx.as({ userId: reporter.id }, q, [target.playerId, randomUUID()]);
      expect(a!.id).toBe(b!.id);
      expect(c!.id).toBe(a!.id);
      const other = await tx.createUser();
      expect(await tx.as({ userId: other.id }, 'select id from public.content_reports')).toEqual([]);
      expect(await tx.fails({ userId: reporter.id }, 'select details from public.content_reports')).toMatch(/permission denied/);
    }));

  it('blocking is idempotent and cannot target self', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const u = await tx.createUser();
      await tx.as({ userId: u.id }, 'select public.block_player($1)', [p.playerId]);
      await tx.as({ userId: u.id }, 'select public.block_player($1)', [p.playerId]);
      expect(await tx.as({ userId: u.id }, 'select player_profile_id from public.my_blocked_players()')).toEqual([{ player_profile_id: p.playerId }]);
      expect(await tx.fails({ userId: p.id }, 'select public.block_player($1)', [p.playerId])).toMatch(/cannot_block_self/);
      expect(await tx.fails({ userId: u.id }, `insert into public.user_blocks (blocker_user_id, blocked_user_id) values ($1, $2)`, [p.id, u.id])).toMatch(
        /permission denied/,
      );
    }));

  it('account deletion request is idempotent and processing anonymizes data', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20), 'Luca Bianchi');
      const [a] = await tx.as({ userId: p.id }, `select public.account_request_deletion('bye') as id`);
      const [b] = await tx.as({ userId: p.id }, `select public.account_request_deletion('bye') as id`);
      expect(a!.id).toBe(b!.id);
      expect(await tx.fails({ userId: p.id }, 'select * from public.account_process_deletion($1)', [a!.id])).toMatch(/permission denied/);
      await tx.as('service_role', 'select * from public.account_process_deletion($1)', [a!.id]);
      await tx.as('service_role', 'select * from public.account_process_deletion($1)', [a!.id]);
      const [row] = await tx.admin('select user_id, display_name, deleted_at from public.player_profiles where id = $1', [p.playerId]);
      expect(row!.user_id).toBeNull();
      expect(row!.display_name).toBe('Profilo rimosso');
      expect(row!.deleted_at).not.toBeNull();
      expect(await tx.admin('select 1 from public.account_private_data where user_id = $1', [p.id])).toEqual([]);
      const [{ status }] = (await tx.admin('select status from public.profiles where id = $1', [p.id])) as [{ status: string }];
      expect(status).toBe('deleted');
    }));

  it('suspended users cannot mutate their profile', () =>
    withTx(async (tx) => {
      const p = await tx.createPlayer(tx.dobForAge(20));
      const staff = await tx.createUser();
      await tx.admin(`insert into public.platform_staff (user_id, role) values ($1, 'admin')`, [staff.id]);
      await tx.as({ userId: staff.id }, `select public.moderation_set_user_suspended($1, true, 'abuse')`, [p.id]);
      expect(await tx.as({ userId: p.id }, `update public.player_profiles set bio = 'x' where id = $1 returning id`, [p.playerId])).toEqual([]);
      const [{ n }] = (await tx.admin(`select count(*)::int as n from public.audit_log where action = 'moderation.user_suspended'`)) as [{ n: number }];
      expect(n).toBe(1);
    }));
});

describe('privilege hygiene', () => {
  it('every public table has RLS enabled', () =>
    withTx(async (tx) => {
      const rows = await tx.admin(
        `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
      );
      expect(rows).toEqual([]);
    }));

  it('anon can execute only an explicit allow-list of functions', () =>
    withTx(async (tx) => {
      const rows = await tx.admin<{ proname: string }>(
        `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') order by 1`,
      );
      expect(rows.map((r) => r.proname)).toEqual([
        'age_on',
        'are_football_roles',
        'get_public_player_profile',
        'is_football_role',
        'media_allowed_mime',
        'media_playback_target',
      ]);
    }));

  it('service-role-only functions are not executable by authenticated users', () =>
    withTx(async (tx) => {
      const serviceOnly = [
        'guardian_issue_invite_token', 'media_begin_processing', 'media_record_probe', 'account_process_deletion',
        'ai_begin_run', 'ai_complete_run', 'ai_fail_run', 'idempotency_begin', 'idempotency_finish', 'write_audit',
      ];
      const rows = await tx.admin<{ proname: string }>(
        `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = any($1) and has_function_privilege('authenticated', p.oid, 'execute')`,
        [serviceOnly],
      );
      expect(rows).toEqual([]);
    }));
});
