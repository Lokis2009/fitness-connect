import type { INestApplication } from '@nestjs/common';
import {
  createDatabase,
  users,
  type DatabaseHandle,
} from '@fitness-connect/database';
import { notInArray } from 'drizzle-orm';
import {
  type ApiResponse,
  call,
  integrationEnv,
  startApp,
  tokenFor,
} from '../testing/test-app';

const SEEDED_EMAILS = [
  'client@example.com',
  'trainer@example.com',
  'pat.pending@example.com',
  'admin@example.com',
];

// Created in the future, so they come first. The two trainers share a created time.
const ADDED = [
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    email: 'admin-list-newest@example.com',
    displayName: 'Newest Client',
    role: 'client',
    createdAt: new Date('2099-01-03T00:00:00Z'),
  },
  {
    id: 'a0000000-0000-4000-8000-0000000000aa',
    email: 'admin-list-tied-low@example.com',
    displayName: 'Tied Low Trainer',
    role: 'trainer',
    createdAt: new Date('2099-01-02T00:00:00Z'),
  },
  {
    id: 'a0000000-0000-4000-8000-0000000000bb',
    email: 'admin-list-tied-high@example.com',
    displayName: 'Tied High Trainer',
    role: 'trainer',
    createdAt: new Date('2099-01-02T00:00:00Z'),
  },
] as const;

interface Page {
  items: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
}

function expectProblem(response: ApiResponse, status: number) {
  expect(response.status).toBe(status);
  expect(response.contentType).toContain('application/problem+json');
  expect(response.body).toMatchObject({ status });
}

describe('GET /v1/admin/users', () => {
  let app: INestApplication;
  let url: string;
  let handle: DatabaseHandle;
  let adminToken: string;

  const list = (query = '', token = adminToken) =>
    call(url, 'GET', `/v1/admin/users${query}`, { token });
  const emails = (response: ApiResponse) =>
    (response.body as Page).items.map((item) => item.email);

  beforeAll(async () => {
    // Its own database, so no other spec adds users that change the totals.
    const env = await integrationEnv({}, 'fitness_connect_test_admin_users');
    handle = createDatabase(env.DATABASE_URL);
    // The database survives between runs: start from the seed alone.
    await handle.db.delete(users).where(notInArray(users.email, SEEDED_EMAILS));
    await handle.db.insert(users).values([...ADDED]);
    ({ app, url } = await startApp(env));
    adminToken = await tokenFor(url, 'admin@example.com');
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end();
  });

  it('answers 401 problem details without a token', async () => {
    expectProblem(await call(url, 'GET', '/v1/admin/users'), 401);
  });

  it.each(['client@example.com', 'trainer@example.com'])(
    'answers 403 problem details for %s',
    async (email) => {
      const token = await tokenFor(url, email);

      expectProblem(await list('', token), 403);
    },
  );

  it('answers the first page of every role for an admin, newest first and then by id descending', async () => {
    const response = await list();

    expect(response.status).toBe(200);
    expect(response.contentType).toContain('application/json');
    const page = response.body as Page;
    expect(page).toMatchObject({ total: 7, page: 1, pageSize: 25 });
    expect(page.items.slice(0, 3)).toEqual([
      {
        id: ADDED[0].id,
        email: ADDED[0].email,
        displayName: 'Newest Client',
        role: 'client',
        createdAt: '2099-01-03T00:00:00.000Z',
      },
      expect.objectContaining({ email: ADDED[2].email }),
      expect.objectContaining({ email: ADDED[1].email }),
    ]);
    expect(emails(response).slice(3).sort()).toEqual([...SEEDED_EMAILS].sort());
  });

  it('never exposes the cognito subject', async () => {
    for (const item of ((await list()).body as Page).items) {
      expect(Object.keys(item).sort()).toEqual([
        'createdAt',
        'displayName',
        'email',
        'id',
        'role',
      ]);
    }
  });

  it('filters by role', async () => {
    const response = await list('?role=trainer');

    expect(response.status).toBe(200);
    expect((response.body as Page).total).toBe(4);
    expect(emails(response).slice(0, 2)).toEqual([
      ADDED[2].email,
      ADDED[1].email,
    ]);
    expect(emails(response).slice(2).sort()).toEqual([
      'pat.pending@example.com',
      'trainer@example.com',
    ]);
  });

  it('pages through the list in a stable order', async () => {
    const first = await list('?page=1&pageSize=2');
    const second = await list('?page=2&pageSize=2');
    const again = await list('?page=1&pageSize=2');

    expect(first.body).toMatchObject({ total: 7, page: 1, pageSize: 2 });
    expect(emails(first)).toEqual([ADDED[0].email, ADDED[2].email]);
    expect(second.body).toMatchObject({ total: 7, page: 2, pageSize: 2 });
    expect(emails(second)[0]).toBe(ADDED[1].email);
    expect(emails(again)).toEqual(emails(first));
  });

  it('answers 200 with no items but the real total past the last page', async () => {
    const response = await list('?page=50');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      total: 7,
      page: 50,
      pageSize: 25,
    });
  });

  it.each([
    ['pageSize over 100', '?pageSize=101'],
    ['pageSize 0', '?pageSize=0'],
    ['page 0', '?page=0'],
    ['a page that is not a number', '?page=abc'],
    ['an unknown role', '?role=superuser'],
    ['an unknown parameter', '?search=casey'],
  ])('answers 400 problem details for %s', async (_name, query) => {
    expectProblem(await list(query), 400);
  });
});
