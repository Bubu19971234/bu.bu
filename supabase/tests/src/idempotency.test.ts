import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { withTx } from './db';

describe('HTTP idempotency keys', () => {
  it('claims once, replays the stored response, detects payload mismatch', () =>
    withTx(async (tx) => {
      const actor = randomUUID();
      const begin = `select * from public.idempotency_begin($1, 'guardian.request', 'key-12345678', $2)`;
      const [first] = await tx.as('service_role', begin, [actor, 'hash-a']);
      expect(first!.outcome).toBe('new');
      const [concurrent] = await tx.as('service_role', begin, [actor, 'hash-a']);
      expect(concurrent!.outcome).toBe('in_progress');
      await tx.as('service_role', `select public.idempotency_finish($1, 'completed', '{"relationshipId":"x"}')`, [first!.id]);
      const [replay] = await tx.as('service_role', begin, [actor, 'hash-a']);
      expect(replay!.outcome).toBe('replay');
      expect(replay!.response).toEqual({ relationshipId: 'x' });
      const [mismatch] = await tx.as('service_role', begin, [actor, 'hash-b']);
      expect(mismatch!.outcome).toBe('mismatch');
    }));

  it('a failed attempt can be retried with the same key', () =>
    withTx(async (tx) => {
      const actor = randomUUID();
      const begin = `select * from public.idempotency_begin($1, 'ai.clip_analysis', 'key-abcdefgh', 'h')`;
      const [first] = await tx.as('service_role', begin, [actor]);
      await tx.as('service_role', `select public.idempotency_finish($1, 'failed', null)`, [first!.id]);
      const [retry] = await tx.as('service_role', begin, [actor]);
      expect(retry!.outcome).toBe('new');
      expect(await tx.fails({ userId: actor }, begin, [actor])).toMatch(/permission denied/);
    }));
});
