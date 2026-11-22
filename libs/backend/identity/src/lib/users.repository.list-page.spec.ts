import {
  createDatabase,
  prepareTestDatabase,
  users,
  type DatabaseHandle,
} from '@fitness-connect/database';
import { notInArray } from 'drizzle-orm';
import { UsersRepository } from './users.repository';

const SEEDED_EMAILS = [
  'client@example.com',
  'trainer@example.com',
  'pat.pending@example.com',
  'admin@example.com',
];

// Created in the future, so they come before the seeded users. Two share a created time to pin the
// tie break on id descending.
const NEWEST = {
  id: 'a0000000-0000-4000-8000-000000000003',
  email: 'list-newest@example.com',
  displayName: 'Newest Client',
  role: 'client',
  createdAt: new Date('2099-01-03T00:00:00Z'),
} as const;
const TIED_HIGH = {
  id: 'a0000000-0000-4000-8000-0000000000bb',
  email: 'list-tied-high@example.com',
  displayName: 'Tied High Trainer',
  role: 'trainer',
  createdAt: new Date('2099-01-02T00:00:00Z'),
} as const;
const TIED_LOW = {
  ...TIED_HIGH,
  id: 'a0000000-0000-4000-8000-0000000000aa',
  email: 'list-tied-low@example.com',
  displayName: 'Tied Low Trainer',
} as const;
const OLDEST = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'list-oldest@example.com',
  displayName: 'Oldest Admin',
  role: 'admin',
  createdAt: new Date('2099-01-01T00:00:00Z'),
} as const;

describe('UsersRepository.listPage (real database)', () => {
  let handle: DatabaseHandle;
  let repository: UsersRepository;

  const emails = (rows: { email: string }[]) => rows.map((row) => row.email);

  beforeAll(async () => {
    // Its own database, so no other spec adds users that change the totals.
    const url = await prepareTestDatabase('fitness_connect_test_identity_list');
    handle = createDatabase(url);
    repository = new UsersRepository(handle.db);

    // The database survives between runs: start from the seed alone.
    await handle.db.delete(users).where(notInArray(users.email, SEEDED_EMAILS));
    // Inserted out of order, so the order comes from the query.
    await handle.db.insert(users).values([TIED_LOW, OLDEST, NEWEST, TIED_HIGH]);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  it('lists every role, newest first, then by id descending', async () => {
    const page = await repository.listPage({ page: 1, pageSize: 4 });

    expect(emails(page.rows)).toEqual([
      NEWEST.email,
      TIED_HIGH.email,
      TIED_LOW.email,
      OLDEST.email,
    ]);
    expect(page.total).toBe(8);
  });

  it('returns stored users with every column', async () => {
    const page = await repository.listPage({ page: 1, pageSize: 1 });

    expect(page.rows).toEqual([{ ...NEWEST, cognitoSub: null }]);
  });

  it('skips the rows of earlier pages', async () => {
    const second = await repository.listPage({ page: 2, pageSize: 2 });
    const third = await repository.listPage({ page: 3, pageSize: 2 });

    expect(emails(second.rows)).toEqual([TIED_LOW.email, OLDEST.email]);
    expect(second.total).toBe(8);
    expect(third.rows).toHaveLength(2);
    expect(SEEDED_EMAILS).toEqual(expect.arrayContaining(emails(third.rows)));
  });

  it('filters by role and counts only that role', async () => {
    const trainers = await repository.listPage({
      role: 'trainer',
      page: 1,
      pageSize: 25,
    });

    const trainerEmails = emails(trainers.rows);
    expect(trainerEmails.slice(0, 2)).toEqual([TIED_HIGH.email, TIED_LOW.email]);
    expect(trainerEmails.slice(2).sort()).toEqual([
      'pat.pending@example.com',
      'trainer@example.com',
    ]);
    expect(trainers.total).toBe(4);

    const clients = await repository.listPage({
      role: 'client',
      page: 1,
      pageSize: 1,
    });
    expect(emails(clients.rows)).toEqual([NEWEST.email]);
    expect(clients.total).toBe(2);
  });

  it('answers no rows but the real total past the last page', async () => {
    const page = await repository.listPage({ page: 100, pageSize: 25 });

    expect(page).toEqual({ rows: [], total: 8 });
  });
});
