import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'node:path';
import type { Database } from './client';

/** Absolute path of the committed drizzle-kit SQL migrations. */
export const MIGRATIONS_FOLDER = join(__dirname, '..', '..', 'migrations');

/** Applies all pending SQL migrations from {@link MIGRATIONS_FOLDER}. */
export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
