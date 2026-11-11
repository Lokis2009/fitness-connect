import { Pool } from 'pg';
import { createDatabase, type DatabaseHandle } from './client';
import { runMigrations } from './migrate';
import { ensureTestDatabase } from './testing';

const NAME = 'fitness_connect_test_database_migrate';

describe('runMigrations', () => {
  let handle: DatabaseHandle;
  let pool: Pool;

  beforeAll(async () => {
    const url = await ensureTestDatabase(NAME, { recreate: true });
    handle = createDatabase(url);
    pool = handle.pool;
    await runMigrations(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  const rows = async (sql: string, params: unknown[] = []) =>
    (await pool.query(sql, params)).rows;

  it('enables the postgis extension first', async () => {
    await expect(
      rows("select extname from pg_extension where extname = 'postgis'"),
    ).resolves.toEqual([{ extname: 'postgis' }]);
    await expect(rows('select postgis_version() as v')).resolves.toHaveLength(
      1,
    );
  });

  it('creates users with the planned columns', async () => {
    const columns = await rows(
      `select column_name, data_type, is_nullable, column_default
         from information_schema.columns
        where table_name = 'users' order by column_name`,
    );

    expect(
      columns.map((c) => [c.column_name, c.data_type, c.is_nullable]),
    ).toEqual([
      ['cognito_sub', 'text', 'YES'],
      ['created_at', 'timestamp with time zone', 'NO'],
      ['display_name', 'text', 'NO'],
      ['email', 'text', 'NO'],
      ['id', 'uuid', 'NO'],
      ['role', 'USER-DEFINED', 'NO'],
    ]);
    const byName = Object.fromEntries(
      columns.map((c) => [c.column_name, c.column_default]),
    );
    expect(byName.id).toContain('gen_random_uuid()');
    expect(byName.created_at).toContain('now()');
  });

  it('limits role to client, trainer and admin', async () => {
    await expect(
      rows(`select unnest(enum_range(null::user_role))::text as role`),
    ).resolves.toEqual([
      { role: 'client' },
      { role: 'trainer' },
      { role: 'admin' },
    ]);
    await expect(
      pool.query(
        "insert into users (email, display_name, role) values ('x@example.com', 'X', 'superuser')",
      ),
    ).rejects.toThrow(/user_role/);
  });

  it('keeps emails and cognito subs unique', async () => {
    await pool.query(
      "insert into users (email, display_name, role, cognito_sub) values ('dup@example.com', 'A', 'client', 'sub-1')",
    );

    await expect(
      pool.query(
        "insert into users (email, display_name, role) values ('dup@example.com', 'B', 'client')",
      ),
    ).rejects.toThrow(/users_email_unique/);
    await expect(
      pool.query(
        "insert into users (email, display_name, role, cognito_sub) values ('other@example.com', 'C', 'client', 'sub-1')",
      ),
    ).rejects.toThrow(/users_cognito_sub_unique/);
  });

  it('stores dev credentials per user and removes them with the user', async () => {
    const [{ id }] = await rows(
      "insert into users (email, display_name, role) values ('cred@example.com', 'D', 'trainer') returning id",
    );
    await pool.query(
      'insert into dev_credentials (user_id, password_hash) values ($1, $2)',
      [id, 'scrypt$x'],
    );
    await expect(
      pool.query(
        'insert into dev_credentials (user_id, password_hash) values ($1, $2)',
        [id, 'scrypt$y'],
      ),
    ).rejects.toThrow(/dev_credentials_pkey/);

    await pool.query('delete from users where id = $1', [id]);

    await expect(
      rows('select * from dev_credentials where user_id = $1', [id]),
    ).resolves.toEqual([]);
  });

  it('can run again without changes', async () => {
    await expect(runMigrations(handle.db)).resolves.toBeUndefined();
  });
});
