import { createDatabase, type Database } from '../lib/client';

/**
 * Runs `task` against the database in DATABASE_URL and always closes the pool.
 * Shared by the `db:migrate` and `db:seed` entry points.
 */
export async function runWithDatabase(
  label: string,
  task: (db: Database) => Promise<void>,
): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env.');
    process.exitCode = 1;
    return;
  }

  const { db, pool } = createDatabase(url);
  try {
    await task(db);
    console.log(`${label}: done`);
  } catch (error) {
    console.error(`${label}: failed`, error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
