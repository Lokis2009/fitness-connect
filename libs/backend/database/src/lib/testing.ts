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

/**
 * Connection URL of the test database `name` on the same server as
 * `baseUrl`. `name` must start with {@link TEST_DATABASE_PREFIX} and contain
 * only lowercase letters, digits and underscores.
 */
export function testDatabaseUrl(baseUrl: string, name: string): string {
  void baseUrl;
  void name;
  throw new Error('not implemented');
}

/**
 * Creates the test database `name` if it is missing (or drops and recreates
 * it with `recreate`). Safe to call from parallel test workers.
 */
export async function ensureTestDatabase(
  name: string,
  options?: TestDatabaseOptions & { recreate?: boolean },
): Promise<string> {
  void name;
  void options;
  throw new Error('not implemented');
}

/**
 * Creates the test database `name` if missing, runs migrations and seeds the
 * dev users. Safe to call from parallel test workers. Returns its URL.
 */
export async function prepareTestDatabase(
  name: string,
  options?: TestDatabaseOptions,
): Promise<string> {
  void name;
  void options;
  throw new Error('not implemented');
}
