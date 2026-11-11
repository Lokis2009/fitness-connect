import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: Pool;
}

/** Opens a connection pool for `url` and wraps it in a Drizzle instance. */
export function createDatabase(url: string): DatabaseHandle {
  void url;
  throw new Error('not implemented');
}
