import { Client } from 'pg';
import {
  DEFAULT_DATABASE_URL,
  ensureTestDatabase,
  prepareTestDatabase,
  testDatabaseUrl,
} from './testing';

const BASE = 'postgres://fitness:secret@db.internal:5433/fitness_connect';
const NAME = 'fitness_connect_test_database_helper';

async function query<T extends object>(url: string, sql: string) {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return (await client.query<T>(sql)).rows;
  } finally {
    await client.end();
  }
}

describe('testDatabaseUrl', () => {
  it('keeps credentials, host and port and swaps the database name', () => {
    expect(testDatabaseUrl(BASE, 'fitness_connect_test_x')).toBe(
      'postgres://fitness:secret@db.internal:5433/fitness_connect_test_x',
    );
  });

  it.each([
    ['the dev database', 'fitness_connect'],
    ['an unrelated database', 'postgres'],
    ['a name with a quote', 'fitness_connect_test"; drop database x; --'],
    ['a name with uppercase letters', 'fitness_connect_test_X'],
    ['a name with a dash', 'fitness_connect_test-1'],
    ['an empty name', ''],
  ])('refuses %s', (_label, name) => {
    expect(() => testDatabaseUrl(BASE, name)).toThrow(/test database/i);
  });

  it('accepts the plain test database name', () => {
    expect(testDatabaseUrl(BASE, 'fitness_connect_test')).toMatch(
      /\/fitness_connect_test$/,
    );
  });

  it('defaults to the local compose database', () => {
    expect(DEFAULT_DATABASE_URL).toBe(
      'postgres://fitness:fitness@localhost:5432/fitness_connect',
    );
  });
});

describe('ensureTestDatabase', () => {
  it('creates the database when it does not exist', async () => {
    const url = await ensureTestDatabase(NAME, { recreate: true });

    expect(url).toMatch(new RegExp(`/${NAME}$`));
    await expect(
      query<{ db: string }>(url, 'select current_database() as db'),
    ).resolves.toEqual([{ db: NAME }]);
  });

  it('keeps existing data on the next call and drops it with recreate', async () => {
    const url = await ensureTestDatabase(NAME, { recreate: true });
    await query(url, 'create table marker (id int)');

    await ensureTestDatabase(NAME);
    await expect(query(url, 'select * from marker')).resolves.toEqual([]);

    await ensureTestDatabase(NAME, { recreate: true });
    await expect(query(url, 'select * from marker')).rejects.toThrow(/marker/);
  });

  it('refuses names outside the test prefix', async () => {
    await expect(ensureTestDatabase('fitness_connect')).rejects.toThrow(
      /test database/i,
    );
  });
});

describe('prepareTestDatabase', () => {
  it('migrates and seeds, also when called by parallel workers', async () => {
    await ensureTestDatabase(NAME, { recreate: true });

    const urls = await Promise.all(
      Array.from({ length: 4 }, () => prepareTestDatabase(NAME)),
    );

    expect(new Set(urls).size).toBe(1);
    const users = await query<{ email: string }>(
      urls[0],
      'select email from users order by email',
    );
    expect(users.map((u) => u.email)).toEqual([
      'admin@example.com',
      'client@example.com',
      'trainer@example.com',
    ]);
  });
});
