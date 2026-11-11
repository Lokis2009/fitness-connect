import { Client } from 'pg';
import { createDatabase } from './client';
import { runMigrations } from './migrate';
import { seedDevUsers } from './seed';

/**
 * Test support: creates throwaway databases next to the one in DATABASE_URL
 * (never the dev database itself), migrates them and seeds the dev users.
 */
export const TEST_DATABASE_PREFIX = 'fitness_connect_test';

/** Where the local Docker Compose Postgres listens; used when DATABASE_URL is unset. */
export const DEFAULT_DATABASE_URL =
  'postgres://fitness:fitness@localhost:5432/fitness_connect';

export interface TestDatabaseOptions {
  /** Server to use; defaults to DATABASE_URL, then {@link DEFAULT_DATABASE_URL}. */
  baseUrl?: string;
}

const TEST_NAME = new RegExp(`^${TEST_DATABASE_PREFIX}[a-z0-9_]*$`);
/** Arbitrary key of the advisory lock that serializes database preparation. */
const PREPARE_LOCK_KEY = 7302501;

function assertTestDatabaseName(name: string): void {
  if (!TEST_NAME.test(name)) {
    throw new Error(
      `"${name}" is not a test database name: it must start with ${TEST_DATABASE_PREFIX} and contain only lowercase letters, digits and underscores`,
    );
  }
}

function resolveBaseUrl(options?: TestDatabaseOptions): string {
  return (
    options?.baseUrl ?? process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL
  );
}

function withDatabaseName(baseUrl: string, name: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

/**
 * Connection URL of the test database `name` on the same server as
 * `baseUrl`. `name` must start with {@link TEST_DATABASE_PREFIX} and contain
 * only lowercase letters, digits and underscores.
 */
export function testDatabaseUrl(baseUrl: string, name: string): string {
  assertTestDatabaseName(name);
  return withDatabaseName(baseUrl, name);
}

/** Runs `work` on the server's maintenance database while holding the prepare lock. */
async function withAdminLock<T>(
  baseUrl: string,
  work: (admin: Client) => Promise<T>,
): Promise<T> {
  const admin = new Client({
    connectionString: withDatabaseName(baseUrl, 'postgres'),
  });
  await admin.connect();
  try {
    await admin.query('select pg_advisory_lock($1)', [PREPARE_LOCK_KEY]);
    return await work(admin);
  } finally {
    await admin.end();
  }
}

async function createDatabaseIfMissing(
  admin: Client,
  name: string,
  recreate: boolean,
): Promise<void> {
  if (recreate) {
    await admin.query(`drop database if exists "${name}" with (force)`);
  }
  const { rowCount } = await admin.query(
    'select 1 from pg_database where datname = $1',
    [name],
  );
  if (!rowCount) {
    await admin.query(`create database "${name}"`);
  }
}

/**
 * Creates the test database `name` if it is missing (or drops and recreates
 * it with `recreate`). Safe to call from parallel test workers.
 */
export async function ensureTestDatabase(
  name: string,
  options?: TestDatabaseOptions & { recreate?: boolean },
): Promise<string> {
  assertTestDatabaseName(name);
  const baseUrl = resolveBaseUrl(options);
  await withAdminLock(baseUrl, (admin) =>
    createDatabaseIfMissing(admin, name, options?.recreate ?? false),
  );
  return withDatabaseName(baseUrl, name);
}

/**
 * Creates the test database `name` if missing, runs migrations and seeds the
 * dev users. Safe to call from parallel test workers. Returns its URL.
 */
export async function prepareTestDatabase(
  name: string,
  options?: TestDatabaseOptions,
): Promise<string> {
  assertTestDatabaseName(name);
  const baseUrl = resolveBaseUrl(options);
  const url = withDatabaseName(baseUrl, name);

  await withAdminLock(baseUrl, async (admin) => {
    await createDatabaseIfMissing(admin, name, false);
    const { db, pool } = createDatabase(url);
    try {
      await runMigrations(db);
      await seedDevUsers(db);
    } finally {
      await pool.end();
    }
  });
  return url;
}
