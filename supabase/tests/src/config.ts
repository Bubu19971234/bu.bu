/** Admin connection to a Postgres server where the test database can be (re)created. */
export const ADMIN_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://postgres@localhost:54329/postgres';
export const TEST_DB_NAME = process.env.TEST_DB_NAME ?? 'ftn_test';

export function testDatabaseUrl(): string {
  const url = new URL(ADMIN_DATABASE_URL);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}
