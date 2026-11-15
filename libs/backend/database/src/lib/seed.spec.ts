import { verifyPassword } from '@fitness-connect/common';
import { asc, eq } from 'drizzle-orm';
import { createDatabase, type DatabaseHandle } from './client';
import { runMigrations } from './migrate';
import {
  bookings,
  bookingStatusChanges,
  devCredentials,
  trainerProfiles,
  users,
  venues,
} from './schema';
import {
  DEV_PASSWORD,
  SEED_USERS,
  seedDevTrainerData,
  seedDevUsers,
} from './seed';
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
      ['pat.pending@example.com', 'trainer'],
      ['admin@example.com', 'admin'],
    ]);
  });

  it('creates the seeded users', async () => {
    await seedDevUsers(handle.db);

    const rows = await allUsers();
    expect(rows.map((u) => [u.email, u.displayName, u.role])).toEqual([
      ['admin@example.com', 'Alex Admin', 'admin'],
      ['client@example.com', 'Casey Client', 'client'],
      ['pat.pending@example.com', 'Pat Pending', 'trainer'],
      ['trainer@example.com', 'Taylor Trainer', 'trainer'],
    ]);
    expect(rows.every((u) => u.displayName.length > 0)).toBe(true);
  });

  it('stores the dev password only as a salted scrypt hash', async () => {
    await seedDevUsers(handle.db);

    const credentials = await handle.db
      .select({ email: users.email, hash: devCredentials.passwordHash })
      .from(devCredentials)
      .innerJoin(users, eq(users.id, devCredentials.userId));

    expect(credentials).toHaveLength(4);
    for (const { hash } of credentials) {
      expect(hash).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[\w-]+\$[\w-]+$/);
      expect(hash).not.toContain(DEV_PASSWORD);
      await expect(verifyPassword(DEV_PASSWORD, hash)).resolves.toBe(true);
      await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
    }
    expect(new Set(credentials.map((c) => c.hash)).size).toBe(4);
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

  it.each([['production'], ['staging'], ['']])(
    'refuses to run when NODE_ENV is "%s"',
    async (value) => {
      const previous = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = value;
      try {
        await expect(seedDevUsers(handle.db)).rejects.toThrow(/NODE_ENV/);
      } finally {
        process.env['NODE_ENV'] = previous;
      }
    },
  );

  it('refuses to run when NODE_ENV is unset', async () => {
    const previous = process.env['NODE_ENV'];
    delete process.env['NODE_ENV'];
    try {
      await expect(seedDevUsers(handle.db)).rejects.toThrow(/NODE_ENV/);
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });

  it('runs when NODE_ENV is development', async () => {
    const previous = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';
    try {
      await expect(seedDevUsers(handle.db)).resolves.toBeUndefined();
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });
});

describe('seedDevTrainerData', () => {
  const NAME_TRAINERS = 'fitness_connect_test_database_seed_trainers';
  const NOW = new Date('2026-11-15T10:00:00.000Z');
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;

  let handle: DatabaseHandle;

  beforeAll(async () => {
    const url = await ensureTestDatabase(NAME_TRAINERS, { recreate: true });
    handle = createDatabase(url);
    await runMigrations(handle.db);
    await seedDevUsers(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  const userId = async (email: string) => {
    const [row] = await handle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    return row.id;
  };

  const seededBookings = () =>
    handle.db.select().from(bookings).orderBy(asc(bookings.startsAt));

  it('approves Taylor and submits Pat', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const rows = await handle.db
      .select({ email: users.email, status: trainerProfiles.status })
      .from(trainerProfiles)
      .innerJoin(users, eq(users.id, trainerProfiles.userId))
      .orderBy(users.email);
    expect(rows).toEqual([
      { email: 'pat.pending@example.com', status: 'submitted' },
      { email: 'trainer@example.com', status: 'approved' },
    ]);
  });

  it('restores a changed profile status on the next run', async () => {
    await seedDevTrainerData(handle.db, NOW);
    await handle.db
      .update(trainerProfiles)
      .set({ status: 'incomplete' })
      .where(eq(trainerProfiles.userId, await userId('trainer@example.com')));

    await seedDevTrainerData(handle.db, NOW);

    const [profile] = await handle.db
      .select()
      .from(trainerProfiles)
      .where(eq(trainerProfiles.userId, await userId('trainer@example.com')));
    expect(profile.status).toBe('approved');
  });

  it('creates the venue of Taylor in Warsaw', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const rows = await handle.db.select().from(venues);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      trainerUserId: await userId('trainer@example.com'),
      name: 'Iron Hall Gym',
      area: 'Powisle',
      address: '12 Example Street',
      instructions: 'Ring the bell at the gym entrance',
      timeZone: 'Europe/Warsaw',
    });
  });

  it('creates four bookings for Taylor from the client at the venue', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const rows = await seededBookings();
    const [venue] = await handle.db.select().from(venues);
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row).toMatchObject({
        trainerUserId: await userId('trainer@example.com'),
        clientUserId: await userId('client@example.com'),
        venueId: venue.id,
        durationMinutes: 60,
        priceMinor: 12000,
        currency: 'PLN',
      });
    }
  });

  it('creates two pending requests that do not overlap', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const pending = (await seededBookings()).filter(
      (b) => b.status === 'pending',
    );
    expect(pending).toHaveLength(2);
    const [b, a] = pending;

    // B starts in 2 hours, inside the late window.
    expect(b.startsAt.getTime()).toBe(NOW.getTime() + 2 * HOUR);
    expect(b.requestedAt.getTime()).toBe(NOW.getTime() - 10 * MINUTE);
    expect(b.expiresAt.getTime()).toBe(NOW.getTime() + 50 * MINUTE);
    expect(b.decidedAt).toBeNull();

    // A starts in 5 hours.
    expect(a.startsAt.getTime()).toBe(NOW.getTime() + 5 * HOUR);
    expect(a.requestedAt.getTime()).toBe(NOW.getTime() - 5 * MINUTE);
    expect(a.expiresAt.getTime()).toBe(NOW.getTime() + 55 * MINUTE);
    expect(a.decidedAt).toBeNull();

    expect(b.startsAt.getTime() + 60 * MINUTE).toBeLessThanOrEqual(
      a.startsAt.getTime(),
    );
  });

  it('creates one confirmed session in progress', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const [inProgress] = (await seededBookings()).filter(
      (b) => b.status === 'confirmed',
    );
    expect(inProgress.startsAt.getTime()).toBe(NOW.getTime() - 15 * MINUTE);
    expect(inProgress.decidedAt).not.toBeNull();
    expect(inProgress.expiresAt.getTime()).toBeGreaterThan(
      inProgress.requestedAt.getTime(),
    );
  });

  it('creates one confirmed session tomorrow at noon in the venue zone', async () => {
    await seedDevTrainerData(handle.db, NOW);

    const confirmed = (await seededBookings()).filter(
      (b) => b.status === 'confirmed',
    );
    expect(confirmed).toHaveLength(2);
    // 2026-11-16 12:00 in Warsaw (UTC+1).
    expect(confirmed[1].startsAt.toISOString()).toBe(
      '2026-11-16T11:00:00.000Z',
    );
    expect(confirmed[1].decidedAt).not.toBeNull();
  });

  it.each([
    ['in summer time', '2026-07-15T10:00:00.000Z', '2026-07-16T10:00:00.000Z'],
    [
      'when it is already tomorrow in Warsaw',
      '2026-11-15T23:30:00.000Z',
      '2026-11-17T11:00:00.000Z',
    ],
    [
      'on the day before the clocks go back',
      '2026-10-24T10:00:00.000Z',
      '2026-10-25T11:00:00.000Z',
    ],
  ])('picks noon tomorrow %s', async (_label, now, expected) => {
    await seedDevTrainerData(handle.db, new Date(now));

    const confirmed = (await seededBookings()).filter(
      (b) => b.status === 'confirmed',
    );
    expect(confirmed.at(-1)?.startsAt.toISOString()).toBe(expected);
  });

  it('is idempotent and replaces the bookings on re-run', async () => {
    await seedDevTrainerData(handle.db, NOW);
    const venueBefore = await handle.db.select().from(venues);
    const bookingsBefore = await seededBookings();

    await seedDevTrainerData(handle.db, NOW);
    await seedDevTrainerData(handle.db, NOW);

    expect(await handle.db.select().from(trainerProfiles)).toHaveLength(2);
    expect(await handle.db.select().from(venues)).toEqual(venueBefore);
    const bookingsAfter = await seededBookings();
    expect(bookingsAfter).toHaveLength(4);
    const oldIds = new Set(bookingsBefore.map((b) => b.id));
    expect(bookingsAfter.some((b) => oldIds.has(b.id))).toBe(false);
  });

  it('deletes the old bookings with their history on re-run', async () => {
    await seedDevTrainerData(handle.db, NOW);
    const [first] = await seededBookings();
    await handle.db
      .insert(bookingStatusChanges)
      .values({ bookingId: first.id, toStatus: 'pending' });

    await seedDevTrainerData(handle.db, NOW);

    expect(await handle.db.select().from(bookingStatusChanges)).toEqual([]);
    expect(await seededBookings()).toHaveLength(4);
  });

  it('restores a changed booking status on re-run', async () => {
    await seedDevTrainerData(handle.db, NOW);
    await handle.db.update(bookings).set({ status: 'declined' });

    await seedDevTrainerData(handle.db, NOW);

    expect((await seededBookings()).map((b) => b.status).sort()).toEqual([
      'confirmed',
      'confirmed',
      'pending',
      'pending',
    ]);
  });

  it('fails clearly when the users are not seeded', async () => {
    const url = await ensureTestDatabase(`${NAME_TRAINERS}_empty`, {
      recreate: true,
    });
    const empty = createDatabase(url);
    try {
      await runMigrations(empty.db);
      await expect(seedDevTrainerData(empty.db, NOW)).rejects.toThrow(
        /seedDevUsers/,
      );
    } finally {
      await empty.pool.end();
    }
  });

  it.each([['production'], ['staging'], ['']])(
    'refuses to run when NODE_ENV is "%s"',
    async (value) => {
      const previous = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = value;
      try {
        await expect(seedDevTrainerData(handle.db, NOW)).rejects.toThrow(
          /NODE_ENV/,
        );
      } finally {
        process.env['NODE_ENV'] = previous;
      }
    },
  );

  it('refuses to run when NODE_ENV is unset', async () => {
    const previous = process.env['NODE_ENV'];
    delete process.env['NODE_ENV'];
    try {
      await expect(seedDevTrainerData(handle.db, NOW)).rejects.toThrow(
        /NODE_ENV/,
      );
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });

  it('runs when NODE_ENV is development', async () => {
    const previous = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';
    try {
      await expect(seedDevTrainerData(handle.db, NOW)).resolves.toBeUndefined();
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });
});
