import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { ADMIN_DATABASE_URL, TEST_DB_NAME, testDatabaseUrl } from './config';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', '..', 'migrations');
const shimPath = join(here, '..', 'shim', 'supabase_shim.sql');

/** Recreates the test database: Supabase shim + every migration in order. */
export default async function setup(): Promise<void> {
  const admin = new pg.Client({ connectionString: ADMIN_DATABASE_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${TEST_DB_NAME} with (force)`);
  await admin.query(`create database ${TEST_DB_NAME}`);
  await admin.end();

  const db = new pg.Client({ connectionString: testDatabaseUrl() });
  await db.connect();
  try {
    await db.query(readFileSync(shimPath, 'utf8'));
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      try {
        await db.query(readFileSync(join(migrationsDir, file), 'utf8'));
      } catch (error) {
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
      }
    }
  } finally {
    await db.end();
  }
}
