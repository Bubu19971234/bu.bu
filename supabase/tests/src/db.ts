import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll } from 'vitest';
import { testDatabaseUrl } from './config';

const pool = new pg.Pool({ connectionString: testDatabaseUrl(), max: 4 });
afterAll(async () => {
  await pool.end();
});

export type Actor = 'anon' | 'service_role' | { userId: string };

export interface TestUser {
  id: string;
  email: string;
}

export class DbError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
  ) {
    super(message);
  }
}

/**
 * A transaction that is always rolled back. `as()` runs a statement with the
 * privileges and JWT claims PostgREST would use for that actor.
 */
export class Tx {
  private savepoint = 0;
  constructor(private readonly client: pg.PoolClient) {}

  async admin<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.client.query<T>(sql, params)).rows;
  }

  async as<T extends pg.QueryResultRow = pg.QueryResultRow>(actor: Actor, sql: string, params: unknown[] = []): Promise<T[]> {
    const sp = `sp_${(this.savepoint += 1)}`;
    const role = actor === 'anon' ? 'anon' : actor === 'service_role' ? 'service_role' : 'authenticated';
    const claims =
      typeof actor === 'object' ? { sub: actor.userId, role: 'authenticated' } : { role };
    await this.client.query(`savepoint ${sp}`);
    try {
      await this.client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
      await this.client.query(`set local role ${role}`);
      const result = await this.client.query<T>(sql, params);
      await this.client.query('reset role');
      await this.client.query(`release savepoint ${sp}`);
      return result.rows;
    } catch (error) {
      await this.client.query(`rollback to savepoint ${sp}`);
      await this.client.query('reset role');
      const e = error as { message: string; code?: string };
      throw new DbError(e.message, e.code);
    }
  }

  /** Like `as`, but expects failure and returns the error message. */
  async fails(actor: Actor, sql: string, params: unknown[] = []): Promise<string> {
    try {
      await this.as(actor, sql, params);
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error(`Expected statement to fail: ${sql}`);
  }

  async createUser(options: { email?: string; confirmed?: boolean } = {}): Promise<TestUser> {
    const email = options.email ?? `${randomUUID()}@example.test`;
    const rows = await this.admin<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ($1, $2) returning id`,
      [email, options.confirmed === false ? null : new Date()],
    );
    return { id: rows[0]!.id, email };
  }

  /** Creates a user with an onboarded player profile. */
  async createPlayer(dateOfBirth: string, displayName = 'Test Player'): Promise<TestUser & { playerId: string; slug: string }> {
    const user = await this.createUser();
    const [row] = await this.as<{ r: { player_profile_id: string; slug: string } }>(
      { userId: user.id },
      `select public.player_onboard($1, $2::date, 175::smallint, 'right', 'CM', array['AM']::text[], 'ASD Test', 8::smallint) as r`,
      [displayName, dateOfBirth],
    );
    return { ...user, playerId: row!.r.player_profile_id, slug: row!.r.slug };
  }

  /** Date string for someone who is `years` old today (minus a margin day). */
  dobForAge(years: number): string {
    const d = new Date();
    d.setUTCFullYear(d.getUTCFullYear() - years);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
}

/** Runs `sql` as `userId` on its own connection and commits (for concurrency tests). */
export async function runCommitted<T extends pg.QueryResultRow>(userId: string, sql: string, params: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: userId, role: 'authenticated' })]);
    await client.query('set local role authenticated');
    const result = await client.query<T>(sql, params);
    await client.query('commit');
    return result.rows;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function adminCommitted<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(sql, params)).rows;
}

export async function withTx(fn: (tx: Tx) => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await fn(new Tx(client));
  } finally {
    await client.query('rollback');
    client.release();
  }
}
