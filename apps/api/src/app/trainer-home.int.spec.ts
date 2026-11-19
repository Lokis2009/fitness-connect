import type { INestApplication } from '@nestjs/common';
import type { Env } from '@fitness-connect/common';
import {
  bookings,
  bookingStatusChanges,
  createDatabase,
  trainerProfiles,
  users,
  venues,
  type DatabaseHandle,
  type NewBookingRow,
} from '@fitness-connect/database';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { responseSchema } from '../testing/contract';
import { validateSchema } from '../testing/json-schema';
import {
  type ApiResponse,
  call,
  integrationEnv,
  mintToken,
  seedTrainerData,
  startApp,
  tokenFor,
} from '../testing/test-app';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const UNKNOWN_ID = 'b0000000-0000-4000-8000-000000000001';

interface Pending {
  id: string;
  clientName: string;
  startsAt: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  venue: { name: string; area: string; timeZone: string };
  requestedAt: string;
  expiresAt: string;
}

interface Session {
  id: string;
  clientName: string;
  startsAt: string;
  durationMinutes: number;
  venue: { name: string; area: string; timeZone: string };
}

describe('trainer home API', () => {
  let env: Env;
  let app: INestApplication;
  let url: string;
  let handle: DatabaseHandle;
  let taylor: string;
  let taylorVenue: string;
  let tokens: Record<'taylor' | 'pat' | 'client', string>;

  beforeAll(async () => {
    // Its own database: every test changes the seeded bookings.
    env = await integrationEnv({}, 'fitness_connect_test_trainer_home');
    handle = createDatabase(env.DATABASE_URL);
    ({ app, url } = await startApp(env));
    tokens = {
      taylor: await tokenFor(url, 'trainer@example.com'),
      pat: await tokenFor(url, 'pat.pending@example.com'),
      client: await tokenFor(url, 'client@example.com'),
    };
  });

  beforeEach(async () => {
    await seedTrainerData(env);
    [{ id: taylor }] = await handle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'trainer@example.com'));
    [{ id: taylorVenue }] = await handle.db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.trainerUserId, taylor));
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end();
  });

  interface TestTrainer {
    id: string;
    venueId: string;
    token: string;
  }

  async function newUser(role: 'client' | 'trainer') {
    const email = `${role}-${randomUUID()}@example.com`;
    const [row] = await handle.db
      .insert(users)
      .values({ email, displayName: `New ${role}`, role })
      .returning({ id: users.id });
    return { id: row.id, email };
  }

  /** An approved trainer with a venue and a token, for tests that need a second trainer. */
  async function newTrainer(): Promise<TestTrainer> {
    const { id, email } = await newUser('trainer');
    await handle.db
      .insert(trainerProfiles)
      .values({ userId: id, status: 'approved' });
    const [venue] = await handle.db
      .insert(venues)
      .values({
        trainerUserId: id,
        name: 'Second Gym',
        area: 'Mokotow',
        address: '99 Secret Street',
        timeZone: 'Europe/Warsaw',
      })
      .returning({ id: venues.id });
    const token = await mintToken({ sub: id, email, role: 'trainer' });
    return { id, venueId: venue.id, token };
  }

  async function newClient(): Promise<string> {
    return (await newUser('client')).id;
  }

  /** A pending request starting in 10 hours, with a deadline in 30 minutes, unless overridden. */
  async function insertBooking(
    trainer: { id: string; venueId: string },
    clientId: string,
    overrides: Partial<NewBookingRow> = {},
  ): Promise<string> {
    const [row] = await handle.db
      .insert(bookings)
      .values({
        trainerUserId: trainer.id,
        clientUserId: clientId,
        venueId: trainer.venueId,
        startsAt: new Date(Date.now() + 10 * HOUR),
        durationMinutes: 60,
        priceMinor: 9000,
        currency: 'PLN',
        status: 'pending',
        requestedAt: new Date(Date.now() - 30 * MINUTE),
        expiresAt: new Date(Date.now() + 30 * MINUTE),
        ...overrides,
      })
      .returning({ id: bookings.id });
    return row.id;
  }

  const getPending = (token?: string) =>
    call(url, 'GET', '/v1/trainers/me/booking-requests', { token });

  const getSessions = (query: string, token?: string) =>
    call(url, 'GET', `/v1/trainers/me/sessions${query}`, { token });

  const post = (id: string, action: 'accept' | 'decline', token?: string) =>
    call(url, 'POST', `/v1/bookings/${id}/${action}`, { token });

  const windowQuery = () =>
    `?from=${new Date(Date.now() - 24 * HOUR).toISOString()}&to=${new Date(
      Date.now() + 72 * HOUR,
    ).toISOString()}`;

  function expectConforms(
    response: ApiResponse,
    method: 'GET' | 'POST',
    path: string,
  ): void {
    const mediaType =
      response.status >= 400 ? 'application/problem+json' : 'application/json';
    expect(response.contentType).toContain(mediaType);
    expect(
      validateSchema(
        responseSchema(method, path, response.status, mediaType) ?? {},
        response.body,
        { strict: true },
      ),
    ).toEqual([]);
  }

  function expectNoAddress(response: ApiResponse): void {
    const text = JSON.stringify(response.body);
    expect(text).not.toMatch(/address/i);
    expect(text).not.toContain('Example Street');
    expect(text).not.toContain('Secret Street');
    expect(text).not.toContain('Ring the bell');
  }

  describe('authentication and approval', () => {
    // Built lazily because `url` is only known after `beforeAll`.
    function all(token?: string): Promise<ApiResponse>[] {
      return [
        getPending(token),
        getSessions(windowQuery(), token),
        post(UNKNOWN_ID, 'accept', token),
        post(UNKNOWN_ID, 'decline', token),
      ];
    }

    it('answers 401 problem details on all four endpoints without a token', async () => {
      for (const response of await Promise.all(all())) {
        expect(response.status).toBe(401);
        expect(response.contentType).toContain('application/problem+json');
      }
    });

    it('answers 403 on all four endpoints for a client', async () => {
      for (const response of await Promise.all(all(tokens.client))) {
        expect(response.status).toBe(403);
        expect(response.contentType).toContain('application/problem+json');
      }
    });

    it('answers 403 with the code trainer-not-approved on all four endpoints for an unapproved trainer', async () => {
      for (const response of await Promise.all(all(tokens.pat))) {
        expect(response.status).toBe(403);
        expect(response.contentType).toContain('application/problem+json');
        expect(response.body).toMatchObject({
          title: 'Forbidden',
          status: 403,
          code: 'trainer-not-approved',
        });
      }
    });

    it.each(['incomplete', 'changes_requested'] as const)(
      'answers 403 for a trainer with status %s and for one without a profile',
      async (status) => {
        const { id, email } = await newUser('trainer');
        await handle.db.insert(trainerProfiles).values({ userId: id, status });
        const withProfile = await mintToken({
          sub: id,
          email,
          role: 'trainer',
        });
        const none = await newUser('trainer');
        const withoutProfile = await mintToken({
          sub: none.id,
          email: none.email,
          role: 'trainer',
        });

        for (const token of [withProfile, withoutProfile]) {
          const response = await getPending(token);
          expect(response.status).toBe(403);
          expect(response.body).toMatchObject({ code: 'trainer-not-approved' });
        }
      },
    );

    it('stops approving a trainer as soon as the status changes', async () => {
      expect((await getPending(tokens.taylor)).status).toBe(200);
      await handle.db
        .update(trainerProfiles)
        .set({ status: 'changes_requested' })
        .where(eq(trainerProfiles.userId, taylor));

      const response = await getPending(tokens.taylor);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ code: 'trainer-not-approved' });
    });
  });

  describe('GET /v1/trainers/me/booking-requests', () => {
    it('lists the seeded requests, soonest deadline first, with the server time', async () => {
      const before = Date.now();

      const response = await getPending(tokens.taylor);

      expect(response.status).toBe(200);
      expectConforms(response, 'GET', '/trainers/me/booking-requests');
      const body = response.body as { serverTime: string; items: Pending[] };
      expect(Math.abs(Date.parse(body.serverTime) - before)).toBeLessThan(
        10_000,
      );
      expect(body.items).toHaveLength(2);
      expect(body.items[0].expiresAt < body.items[1].expiresAt).toBe(true);
      // The request that starts in two hours is the one made 10 minutes ago.
      expect(Date.parse(body.items[0].startsAt) - before).toBeLessThan(
        3 * HOUR,
      );
      expect(body.items[0]).toEqual({
        id: expect.any(String),
        clientName: 'Casey Client',
        startsAt: expect.any(String),
        durationMinutes: 60,
        priceMinor: 12000,
        currency: 'PLN',
        venue: {
          name: 'Iron Hall Gym',
          area: 'Powisle',
          timeZone: 'Europe/Warsaw',
        },
        requestedAt: expect.any(String),
        expiresAt: expect.any(String),
      });
      expectNoAddress(response);
    });

    it('leaves out a request once its deadline has passed, without a job to expire it', async () => {
      const { items } = (await getPending(tokens.taylor)).body as {
        items: Pending[];
      };
      await handle.db
        .update(bookings)
        .set({
          requestedAt: new Date(Date.now() - 2 * HOUR),
          expiresAt: new Date(Date.now() - 1_000),
        })
        .where(eq(bookings.id, items[0].id));

      const after = (await getPending(tokens.taylor)).body as {
        items: Pending[];
      };

      expect(after.items.map((item) => item.id)).toEqual([items[1].id]);
    });

    it('shows a trainer only their own requests', async () => {
      const other = await newTrainer();
      const mine = await insertBooking(other, await newClient());

      const response = await getPending(other.token);

      expect(
        (response.body as { items: Pending[] }).items.map((item) => item.id),
      ).toEqual([mine]);
    });

    it('answers with an empty list for a trainer without requests', async () => {
      const other = await newTrainer();

      const response = await getPending(other.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        serverTime: expect.any(String),
        items: [],
      });
    });
  });

  describe('GET /v1/trainers/me/sessions', () => {
    it('lists the confirmed sessions in the range, soonest first, without price or address', async () => {
      const response = await getSessions(windowQuery(), tokens.taylor);

      expect(response.status).toBe(200);
      expectConforms(response, 'GET', '/trainers/me/sessions');
      const { items } = response.body as { items: Session[] };
      expect(items).toHaveLength(2);
      expect(items[0].startsAt < items[1].startsAt).toBe(true);
      expect(items[0]).toEqual({
        id: expect.any(String),
        clientName: 'Casey Client',
        startsAt: expect.any(String),
        durationMinutes: 60,
        venue: {
          name: 'Iron Hall Gym',
          area: 'Powisle',
          timeZone: 'Europe/Warsaw',
        },
      });
      expect(JSON.stringify(response.body)).not.toMatch(/price|currency/i);
      expectNoAddress(response);
    });

    it('returns the session in progress when the range starts after it began', async () => {
      const from = new Date(Date.now() - 5 * MINUTE).toISOString();
      const to = new Date(Date.now() + HOUR).toISOString();

      const response = await getSessions(
        `?from=${from}&to=${to}`,
        tokens.taylor,
      );

      const { items } = response.body as { items: Session[] };
      expect(items).toHaveLength(1);
      expect(Date.parse(items[0].startsAt)).toBeLessThan(Date.now());
    });

    it('treats to as exclusive and accepts offsets', async () => {
      const [first] = (
        (await getSessions(windowQuery(), tokens.taylor)).body as {
          items: Session[];
        }
      ).items;
      const start = new Date(first.startsAt);
      const offset = (instant: Date) =>
        instant.toISOString().replace('Z', '+00:00').replace(/\+/g, '%2B');

      const ends = await getSessions(
        `?from=${offset(new Date(start.getTime() - HOUR))}&to=${offset(start)}`,
        tokens.taylor,
      );

      expect(ends.status).toBe(200);
      expect((ends.body as { items: Session[] }).items).toEqual([]);
    });

    it('accepts a range of exactly 7 days', async () => {
      const from = new Date(Date.now() - HOUR);
      const to = new Date(from.getTime() + 7 * 24 * HOUR);

      const response = await getSessions(
        `?from=${from.toISOString()}&to=${to.toISOString()}`,
        tokens.taylor,
      );

      expect(response.status).toBe(200);
    });

    it('leaves out unconfirmed bookings and other trainers’ sessions', async () => {
      const other = await newTrainer();
      await insertBooking(other, await newClient(), { status: 'confirmed' });

      const mine = (await getSessions(windowQuery(), tokens.taylor)).body as {
        items: Session[];
      };

      expect(mine.items).toHaveLength(2);
      const theirs = (await getSessions(windowQuery(), other.token)).body as {
        items: Session[];
      };
      expect(theirs.items).toHaveLength(1);
    });

    it.each([
      [
        'a span over 7 days',
        '?from=2031-03-10T00:00:00Z&to=2031-03-17T00:00:01Z',
      ],
      ['a bare date', '?from=2031-03-10&to=2031-03-11'],
      ['no offset', '?from=2031-03-10T00:00:00&to=2031-03-11T00:00:00'],
      ['from after to', '?from=2031-03-11T00:00:00Z&to=2031-03-10T00:00:00Z'],
      [
        'from equal to to',
        '?from=2031-03-10T00:00:00Z&to=2031-03-10T00:00:00Z',
      ],
      ['a missing to', '?from=2031-03-10T00:00:00Z'],
      ['no query', ''],
      [
        'an unknown parameter',
        '?from=2031-03-10T00:00:00Z&to=2031-03-11T00:00:00Z&limit=5',
      ],
    ])('answers 400 problem details for %s', async (_name, query) => {
      const response = await getSessions(query, tokens.taylor);

      expect(response.status).toBe(400);
      expectConforms(response, 'GET', '/trainers/me/sessions');
      expect(response.body).toMatchObject({
        title: 'Bad Request',
        status: 400,
      });
    });
  });

  describe.each(['accept', 'decline'] as const)(
    'POST /v1/bookings/{id}/%s',
    (action) => {
      const settled = action === 'accept' ? 'confirmed' : 'declined';
      const opposite = action === 'accept' ? 'decline' : 'accept';

      async function firstPendingId(): Promise<string> {
        const { items } = (await getPending(tokens.taylor)).body as {
          items: Pending[];
        };
        return items[0].id;
      }

      it(`answers 200 with the booking ${settled}, and the lists follow`, async () => {
        const id = await firstPendingId();

        const response = await post(id, action, tokens.taylor);

        expect(response.status).toBe(200);
        expectConforms(response, 'POST', `/bookings/{id}/${action}`);
        expect(response.body).toEqual({
          id,
          status: settled,
          startsAt: expect.any(String),
          decidedAt: expect.any(String),
        });
        const pending = (await getPending(tokens.taylor)).body as {
          items: Pending[];
        };
        expect(pending.items.map((item) => item.id)).not.toContain(id);
        const sessions = (await getSessions(windowQuery(), tokens.taylor))
          .body as {
          items: Session[];
        };
        expect(sessions.items.some((item) => item.id === id)).toBe(
          action === 'accept',
        );
      });

      it('answers a repeat with 200 and the same booking', async () => {
        const id = await firstPendingId();
        const first = await post(id, action, tokens.taylor);

        const again = await post(id, action, tokens.taylor);

        expect(again.status).toBe(200);
        expect(again.body).toEqual(first.body);
        const history = await handle.db
          .select()
          .from(bookingStatusChanges)
          .where(eq(bookingStatusChanges.bookingId, id));
        expect(history).toHaveLength(1);
      });

      it(`answers ${opposite} after ${action} with 409 booking-not-pending`, async () => {
        const id = await firstPendingId();
        await post(id, action, tokens.taylor);

        const response = await post(id, opposite, tokens.taylor);

        expect(response.status).toBe(409);
        expect(response.contentType).toContain('application/problem+json');
        expect(response.body).toMatchObject({
          status: 409,
          code: 'booking-not-pending',
        });
        expectConforms(response, 'POST', `/bookings/{id}/${action}`);
      });

      it('answers 409 booking-expired once the deadline has passed, and changes nothing', async () => {
        const id = await firstPendingId();
        await handle.db
          .update(bookings)
          .set({
            requestedAt: new Date(Date.now() - 2 * HOUR),
            expiresAt: new Date(Date.now() - 1_000),
          })
          .where(eq(bookings.id, id));

        const response = await post(id, action, tokens.taylor);

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({ code: 'booking-expired' });
        const [row] = await handle.db
          .select({ status: bookings.status })
          .from(bookings)
          .where(eq(bookings.id, id));
        expect(row.status).toBe('pending');
      });

      it('answers 409 booking-withdrawn for a request the client withdrew', async () => {
        const id = await insertBooking(
          { id: taylor, venueId: taylorVenue },
          await newClient(),
          { status: 'withdrawn' },
        );

        const response = await post(id, action, tokens.taylor);

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({ code: 'booking-withdrawn' });
      });

      it('answers 404 for another trainer’s booking, an unknown id and a malformed id', async () => {
        const other = await newTrainer();
        const foreign = await insertBooking(other, await newClient());

        for (const id of [foreign, UNKNOWN_ID, 'not-a-uuid', '123']) {
          const response = await post(id, action, tokens.taylor);

          expect(response.status).toBe(404);
          expect(response.contentType).toContain('application/problem+json');
          expect(response.body).toMatchObject({
            title: 'Not Found',
            status: 404,
          });
        }
        const [row] = await handle.db
          .select({ status: bookings.status })
          .from(bookings)
          .where(eq(bookings.id, foreign));
        expect(row.status).toBe('pending');
      });
    },
  );

  describe('accepting a request', () => {
    it('withdraws the client’s overlapping requests to other trainers and keeps touching ones', async () => {
      const other = await newTrainer();
      const client = await newClient();
      const start = Date.now() + 20 * HOUR;
      const mine = await insertBooking(
        { id: taylor, venueId: taylorVenue },
        client,
        { startsAt: new Date(start) },
      );
      const overlapping = await insertBooking(other, client, {
        startsAt: new Date(start + 30 * MINUTE),
      });
      const touching = await insertBooking(other, client, {
        startsAt: new Date(start + HOUR),
      });

      const accepted = await post(mine, 'accept', tokens.taylor);

      expect(accepted.status).toBe(200);
      const lost = await post(overlapping, 'accept', other.token);
      expect(lost.status).toBe(409);
      expect(lost.body).toMatchObject({ code: 'booking-withdrawn' });
      const remaining = (await getPending(other.token)).body as {
        items: Pending[];
      };
      expect(remaining.items.map((item) => item.id)).toEqual([touching]);
    });

    it('lets exactly one of two trainers win when both accept the client’s overlapping requests at once', async () => {
      for (let round = 0; round < 5; round++) {
        const first = await newTrainer();
        const second = await newTrainer();
        const client = await newClient();
        const start = Date.now() + 30 * HOUR;
        const a = await insertBooking(first, client, {
          startsAt: new Date(start),
        });
        const b = await insertBooking(second, client, {
          startsAt: new Date(start + 15 * MINUTE),
        });

        const responses = await Promise.all([
          post(a, 'accept', first.token),
          post(b, 'accept', second.token),
        ]);

        expect(responses.map((response) => response.status).sort()).toEqual([
          200, 409,
        ]);
        const loser = responses.find((response) => response.status === 409);
        expect(loser?.body).toMatchObject({ code: 'booking-withdrawn' });
        const statuses = await handle.db
          .select({ id: bookings.id, status: bookings.status })
          .from(bookings)
          .where(eq(bookings.clientUserId, client));
        expect(statuses.map((row) => row.status).sort()).toEqual([
          'confirmed',
          'withdrawn',
        ]);
      }
    });

    it('shows no address in any answer', async () => {
      const id = (
        (await getPending(tokens.taylor)).body as { items: Pending[] }
      ).items[0].id;

      const response = await post(id, 'accept', tokens.taylor);

      expectNoAddress(response);
    });
  });
});
