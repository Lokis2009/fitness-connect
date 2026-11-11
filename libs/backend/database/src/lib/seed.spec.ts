import { verifyPassword } from '@fitness-connect/common';
import { eq } from 'drizzle-orm';
import { createDatabase, type DatabaseHandle } from './client';
import { runMigrations } from './migrate';
import { devCredentials, users } from './schema';
import { DEV_PASSWORD, SEED_USERS, seedDevUsers } from './seed';
import { ensureTestDatabase } from './testing';

const NAME = 'fitness_connect_test_database_seed';

describe('seedDevUsers', () => {
  let handle: DatabaseHandle;

  beforeAll(async () => {
    const url = await ensureTestDatabase(NAME, { recreate: true });
    handle = createDatabase(url);
    await runMigrations(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  const allUsers = () => handle.db.select().from(users).orderBy(users.email);

  it('documents the dev password and the seeded accounts', () => {
    expect(DEV_PASSWORD).toBe('password');
    expect(SEED_USERS.map((u) => [u.email, u.role])).toEqual([
      ['client@example.com', 'client'],
      ['trainer@example.com', 'trainer'],
      ['admin@example.com', 'admin'],
    ]);
  });

  it('creates one user per role', async () => {
    await seedDevUsers(handle.db);

    const rows = await allUsers();
    expect(rows.map((u) => [u.email, u.role])).toEqual([
      ['admin@example.com', 'admin'],
      ['client@example.com', 'client'],
      ['trainer@example.com', 'trainer'],
    ]);
    expect(rows.every((u) => u.displayName.length > 0)).toBe(true);
  });

  it('stores the dev password only as a salted scrypt hash', async () => {
    await seedDevUsers(handle.db);

    const credentials = await handle.db
      .select({ email: users.email, hash: devCredentials.passwordHash })
      .from(devCredentials)
      .innerJoin(users, eq(users.id, devCredentials.userId));

    expect(credentials).toHaveLength(3);
    for (const { hash } of credentials) {
      expect(hash).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[\w-]+\$[\w-]+$/);
      expect(hash).not.toContain(DEV_PASSWORD);
      await expect(verifyPassword(DEV_PASSWORD, hash)).resolves.toBe(true);
      await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
    }
    expect(new Set(credentials.map((c) => c.hash)).size).toBe(3);
  });

  it('is idempotent and keeps ids and hashes stable', async () => {
    await seedDevUsers(handle.db);
    const before = {
      users: await allUsers(),
      hashes: await handle.db.select().from(devCredentials),
    };

    await seedDevUsers(handle.db);
    await seedDevUsers(handle.db);

    expect(await allUsers()).toEqual(before.users);
    expect(await handle.db.select().from(devCredentials)).toEqual(
      before.hashes,
    );
  });

  it('restores a changed role or name on the next run', async () => {
    await seedDevUsers(handle.db);
    await handle.db
      .update(users)
      .set({ role: 'client', displayName: 'Changed' })
      .where(eq(users.email, 'admin@example.com'));

    await seedDevUsers(handle.db);

    const [admin] = await handle.db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'));
    expect(admin.role).toBe('admin');
    expect(admin.displayName).not.toBe('Changed');
  });

  it('refuses to run in production', async () => {
    const previous = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    try {
      await expect(seedDevUsers(handle.db)).rejects.toThrow(/production/);
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });
});
