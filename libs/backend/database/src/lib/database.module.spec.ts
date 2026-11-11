import { AppConfigModule, type Env } from '@fitness-connect/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { createDatabase } from './client';
import { DATABASE, DatabaseModule } from './database.module';
import type { Database } from './client';
import { prepareTestDatabase } from './testing';

const NAME = 'fitness_connect_test_database';

describe('createDatabase', () => {
  it('opens a pool that answers queries', async () => {
    const url = await prepareTestDatabase(NAME);
    const { db, pool } = createDatabase(url);

    try {
      const result = await db.execute(sql`select 1 as one`);
      expect(result.rows).toEqual([{ one: 1 }]);
    } finally {
      await pool.end();
    }
  });
});

describe('DatabaseModule', () => {
  async function compile() {
    const url = await prepareTestDatabase(NAME);
    const env: Env = {
      NODE_ENV: 'test',
      API_PORT: 3000,
      CORS_ORIGINS: [],
      DATABASE_URL: url,
      JWT_DEV_SECRET: 'secret-for-tests',
    };
    return Test.createTestingModule({
      imports: [AppConfigModule.forRoot(env), DatabaseModule],
    }).compile();
  }

  it('provides a Drizzle instance connected to DATABASE_URL', async () => {
    const moduleRef = await compile();
    const db = moduleRef.get<Database>(DATABASE);

    try {
      const result = await db.execute(sql`select current_database() as name`);
      expect(result.rows).toEqual([{ name: NAME }]);
    } finally {
      await moduleRef.close();
    }
  });

  it('closes the pool on shutdown', async () => {
    const moduleRef = await compile();
    const db = moduleRef.get<Database>(DATABASE);

    await moduleRef.close();

    await expect(db.execute(sql`select 1`)).rejects.toMatchObject({
      cause: {
        message: expect.stringMatching(/after calling end on the pool/),
      },
    });
  });
});
