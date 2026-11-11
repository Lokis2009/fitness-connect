import type { Database } from './client';

/** Absolute path of the committed drizzle-kit SQL migrations. */
export const MIGRATIONS_FOLDER = `${__dirname}/../../migrations`;

/** Applies all pending SQL migrations from {@link MIGRATIONS_FOLDER}. */
export async function runMigrations(db: Database): Promise<void> {
  void db;
  throw new Error('not implemented');
}
