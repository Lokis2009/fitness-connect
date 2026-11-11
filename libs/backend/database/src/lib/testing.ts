/**
 * Test support: creates a throwaway database next to the one in DATABASE_URL
 * (never the dev database itself), migrates it and seeds the dev users.
 */
export const TEST_DATABASE_PREFIX = 'fitness_connect_test';

/**
 * Connection URL of the test database `name` on the same server as
 * `baseUrl`. `name` must start with {@link TEST_DATABASE_PREFIX}.
 */
export function testDatabaseUrl(baseUrl: string, name: string): string {
  void baseUrl;
  void name;
  throw new Error('not implemented');
}

/** Creates the database `name` if missing, runs migrations and seeds dev users. */
export async function prepareTestDatabase(
  baseUrl: string,
  name: string,
): Promise<string> {
  void baseUrl;
  void name;
  throw new Error('not implemented');
}
