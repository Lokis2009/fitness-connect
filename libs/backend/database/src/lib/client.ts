import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: Pool;
}

/** Opens a connection pool for `url` and wraps it in a Drizzle instance. */
export function createDatabase(url: string): DatabaseHandle {
  const pool = new Pool({ connectionString: url });
  // An idle client dropped by the server must not crash the process.
  pool.on('error', (error) => {
    new Logger('Database').error(`Idle client error: ${error.message}`);
  });
  return { db: drizzle(pool, { schema }), pool };
}
