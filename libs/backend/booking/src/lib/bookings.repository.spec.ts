import { NotFoundException } from '@nestjs/common';
import {
  bookings,
  bookingStatusChanges,
  createDatabase,
  prepareTestDatabase,
  trainerProfiles,
  users,
  venues,
  type DatabaseHandle,
  type NewBookingRow,
} from '@fitness-connect/database';
import { asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  BookingConflictException,
  BookingsRepository,
  type BookingStatus,
} from './bookings.repository';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe('BookingsRepository (real database)', () => {
  let handle: DatabaseHandle;
  let repository: BookingsRepository;

  beforeAll(async () => {
    const url = await prepareTestDatabase('fitness_connect_test_booking');
    handle = createDatabase(url);
    repository = new BookingsRepository(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  async function newUser(role: 'client' | 'trainer'): Promise<string> {
    const [row] = await handle.db
      .insert(users)
      .values({
        email: `${role}-${randomUUID()}@example.com`,
        displayName: `Temp ${role}`,
        role,
      })
      .returning({ id: users.id });
    return row.id;
  }

  interface Trainer {
    id: string;
    venueId: string;
  }

  async function newTrainer(): Promise<Trainer> {
    const id = await newUser('trainer');
    await handle.db
      .insert(trainerProfiles)
      .values({ userId: id, status: 'approved' });
    const [venue] = await handle.db
      .insert(venues)
      .values({
        trainerUserId: id,
        name: 'Test Gym',
        area: 'Centre',
        address: '1 Test Street',
        timeZone: 'Europe/Warsaw',
      })
      .returning({ id: venues.id });
    return { id, venueId: venue.id };
  }

  /** Inserts a booking. Defaults: pending, starts in 5 hours for 60 minutes, expires in 30 minutes. */
  async function newBooking(
    trainer: Trainer,
    clientId: string,
    overrides: Partial<NewBookingRow> = {},
  ): Promise<string> {
    const now = Date.now();
    const [row] = await handle.db
      .insert(bookings)
      .values({
        trainerUserId: trainer.id,
        clientUserId: clientId,
        venueId: trainer.venueId,
        startsAt: new Date(now + 5 * HOUR),
        durationMinutes: 60,
        priceMinor: 12000,
        currency: 'PLN',
        status: 'pending',
        requestedAt: new Date(now - 30 * MINUTE),
        expiresAt: new Date(now + 30 * MINUTE),
        ...overrides,
      })
      .returning({ id: bookings.id });
    return row.id;
  }

  async function statusOf(id: string): Promise<BookingStatus> {
    const [row] = await handle.db
      .select({ status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, id));
    return row.status;
  }

  function historyOf(id: string) {
    return handle.db
      .select({
        from: bookingStatusChanges.fromStatus,
        to: bookingStatusChanges.toStatus,
      })
      .from(bookingStatusChanges)
      .where(eq(bookingStatusChanges.bookingId, id))
      .orderBy(asc(bookingStatusChanges.changedAt));
  }

  async function expectConflict(
    promise: Promise<unknown>,
    code: string,
  ): Promise<void> {
    const error: unknown = await promise.then(
      () => null,
      (rejected: unknown) => rejected,
    );
    expect(error).toBeInstanceOf(BookingConflictException);
    expect(error).toMatchObject({ code });
    expect((error as BookingConflictException).getStatus()).toBe(409);
  }

  describe('pendingForTrainer', () => {
    it('lists the open requests of the trainer, soonest deadline first, with the database time', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const later = await newBooking(trainer, client, {
        expiresAt: new Date(Date.now() + 50 * MINUTE),
      });
      const sooner = await newBooking(trainer, client, {
        expiresAt: new Date(Date.now() + 10 * MINUTE),
      });

      const before = Date.now();
      const { rows, serverTime } = await repository.pendingForTrainer(
        trainer.id,
      );

      expect(rows.map((row) => row.id)).toEqual([sooner, later]);
      expect(rows[0]).toMatchObject({
        trainerUserId: trainer.id,
        clientUserId: client,
        venueId: trainer.venueId,
        durationMinutes: 60,
        priceMinor: 12000,
        currency: 'PLN',
        status: 'pending',
        decidedAt: null,
      });
      expect(rows[0].startsAt).toBeInstanceOf(Date);
      expect(rows[0].expiresAt).toBeInstanceOf(Date);
      expect(Math.abs(serverTime.getTime() - before)).toBeLessThan(5_000);
    });

    it('leaves out requests past their deadline, other statuses and other trainers', async () => {
      const trainer = await newTrainer();
      const other = await newTrainer();
      const client = await newUser('client');
      const open = await newBooking(trainer, client);
      await newBooking(trainer, client, {
        requestedAt: new Date(Date.now() - 2 * HOUR),
        expiresAt: new Date(Date.now() - 1),
      });
      for (const status of [
        'confirmed',
        'declined',
        'expired',
        'withdrawn',
        'cancelled',
        'completed',
      ] as const) {
        await newBooking(trainer, client, { status });
      }
      await newBooking(other, client);

      const { rows } = await repository.pendingForTrainer(trainer.id);

      expect(rows.map((row) => row.id)).toEqual([open]);
    });

    it('returns an empty list for a trainer without requests', async () => {
      const trainer = await newTrainer();

      const { rows } = await repository.pendingForTrainer(trainer.id);

      expect(rows).toEqual([]);
    });
  });

  describe('sessionsForTrainer', () => {
    const from = new Date('2031-03-10T00:00:00Z');
    const to = new Date('2031-03-12T00:00:00Z');

    async function confirmed(
      trainer: Trainer,
      client: string,
      startsAt: string,
      overrides: Partial<NewBookingRow> = {},
    ): Promise<string> {
      return newBooking(trainer, client, {
        status: 'confirmed',
        startsAt: new Date(startsAt),
        ...overrides,
      });
    }

    it('returns confirmed sessions that overlap the range, soonest first', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const second = await confirmed(trainer, client, '2031-03-11T10:00:00Z');
      const first = await confirmed(trainer, client, '2031-03-10T09:00:00Z');

      const { rows, serverTime } = await repository.sessionsForTrainer(
        trainer.id,
        from,
        to,
      );

      expect(rows.map((row) => row.id)).toEqual([first, second]);
      expect(rows[0].status).toBe('confirmed');
      expect(Math.abs(serverTime.getTime() - Date.now())).toBeLessThan(5_000);
    });

    it('returns a session that started before from and is still running', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const running = await confirmed(trainer, client, '2031-03-09T23:30:00Z');

      const { rows } = await repository.sessionsForTrainer(
        trainer.id,
        from,
        to,
      );

      expect(rows.map((row) => row.id)).toEqual([running]);
    });

    it('leaves out a session that ends exactly at from and one that starts exactly at to', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      await confirmed(trainer, client, '2031-03-09T23:00:00Z');
      await confirmed(trainer, client, '2031-03-12T00:00:00Z');
      const justInside = await confirmed(
        trainer,
        client,
        '2031-03-11T23:59:00Z',
      );

      const { rows } = await repository.sessionsForTrainer(
        trainer.id,
        from,
        to,
      );

      expect(rows.map((row) => row.id)).toEqual([justInside]);
    });

    it('leaves out other statuses and other trainers', async () => {
      const trainer = await newTrainer();
      const other = await newTrainer();
      const client = await newUser('client');
      const mine = await confirmed(trainer, client, '2031-03-10T09:00:00Z');
      for (const status of [
        'pending',
        'declined',
        'expired',
        'withdrawn',
        'cancelled',
        'completed',
      ] as const) {
        await confirmed(trainer, client, '2031-03-10T12:00:00Z', { status });
      }
      await confirmed(other, client, '2031-03-10T09:00:00Z');

      const { rows } = await repository.sessionsForTrainer(
        trainer.id,
        from,
        to,
      );

      expect(rows.map((row) => row.id)).toEqual([mine]);
    });

    it('uses the duration of each session to decide the overlap', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const long = await confirmed(trainer, client, '2031-03-09T21:00:00Z', {
        durationMinutes: 181,
      });
      await confirmed(trainer, client, '2031-03-09T21:00:00Z', {
        durationMinutes: 180,
      });

      const { rows } = await repository.sessionsForTrainer(
        trainer.id,
        from,
        to,
      );

      expect(rows.map((row) => row.id)).toEqual([long]);
    });
  });

  describe('decide', () => {
    it('accepts a pending request: confirmed, decided_at set and one history row', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const id = await newBooking(trainer, client);

      const before = Date.now();
      const result = await repository.decide(trainer.id, id, 'accept');

      expect(result.repeat).toBe(false);
      expect(result.booking).toMatchObject({ id, status: 'confirmed' });
      expect(result.booking.decidedAt?.getTime()).toBeGreaterThanOrEqual(
        before - 1_000,
      );
      expect(await statusOf(id)).toBe('confirmed');
      expect(await historyOf(id)).toEqual([
        { from: 'pending', to: 'confirmed' },
      ]);
    });

    it('declines a pending request: declined, decided_at set and one history row', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const id = await newBooking(trainer, client);

      const result = await repository.decide(trainer.id, id, 'decline');

      expect(result.repeat).toBe(false);
      expect(result.booking).toMatchObject({ id, status: 'declined' });
      expect(result.booking.decidedAt).toBeInstanceOf(Date);
      expect(await historyOf(id)).toEqual([
        { from: 'pending', to: 'declined' },
      ]);
    });

    it('answers a repeated accept with the current booking and no new history', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const id = await newBooking(trainer, client);
      const first = await repository.decide(trainer.id, id, 'accept');

      const again = await repository.decide(trainer.id, id, 'accept');

      expect(again.repeat).toBe(true);
      expect(again.booking).toEqual(first.booking);
      expect(await historyOf(id)).toHaveLength(1);
    });

    it('answers a repeated decline with the current booking and no new history', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const id = await newBooking(trainer, client);
      await repository.decide(trainer.id, id, 'decline');

      const again = await repository.decide(trainer.id, id, 'decline');

      expect(again.repeat).toBe(true);
      expect(again.booking.status).toBe('declined');
      expect(await historyOf(id)).toHaveLength(1);
    });

    it('refuses an accept after a decline and a decline after an accept', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const declined = await newBooking(trainer, client);
      await repository.decide(trainer.id, declined, 'decline');
      const accepted = await newBooking(trainer, client, {
        startsAt: new Date(Date.now() + 20 * HOUR),
      });
      await repository.decide(trainer.id, accepted, 'accept');

      await expectConflict(
        repository.decide(trainer.id, declined, 'accept'),
        'booking-not-pending',
      );
      await expectConflict(
        repository.decide(trainer.id, accepted, 'decline'),
        'booking-not-pending',
      );
      expect(await statusOf(declined)).toBe('declined');
      expect(await statusOf(accepted)).toBe('confirmed');
    });

    it.each(['accept', 'decline'] as const)(
      'refuses to %s a pending request past its deadline and leaves it as it is',
      async (action) => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const id = await newBooking(trainer, client, {
          requestedAt: new Date(Date.now() - 2 * HOUR),
          expiresAt: new Date(Date.now() - MINUTE),
        });

        await expectConflict(
          repository.decide(trainer.id, id, action),
          'booking-expired',
        );

        expect(await statusOf(id)).toBe('pending');
        expect(await historyOf(id)).toEqual([]);
      },
    );

    it.each([
      ['expired', 'booking-expired'],
      ['withdrawn', 'booking-withdrawn'],
      ['cancelled', 'booking-not-pending'],
      ['completed', 'booking-not-pending'],
    ] as const)(
      'answers 409 for a %s booking with the code %s',
      async (status, code) => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const id = await newBooking(trainer, client, { status });

        await expectConflict(repository.decide(trainer.id, id, 'accept'), code);
        await expectConflict(
          repository.decide(trainer.id, id, 'decline'),
          code,
        );
        expect(await statusOf(id)).toBe(status);
      },
    );

    it('carries the booking in the conflict', async () => {
      const trainer = await newTrainer();
      const client = await newUser('client');
      const id = await newBooking(trainer, client, { status: 'withdrawn' });

      const error = await repository
        .decide(trainer.id, id, 'accept')
        .catch((rejected: unknown) => rejected);

      expect((error as BookingConflictException).booking).toMatchObject({
        id,
        status: 'withdrawn',
      });
    });

    it('answers 404 for another trainer’s booking, an unknown id and a malformed id', async () => {
      const trainer = await newTrainer();
      const other = await newTrainer();
      const client = await newUser('client');
      const foreign = await newBooking(other, client);

      for (const id of [foreign, randomUUID(), 'not-a-uuid']) {
        await expect(
          repository.decide(trainer.id, id, 'accept'),
        ).rejects.toBeInstanceOf(NotFoundException);
      }
      expect(await statusOf(foreign)).toBe('pending');
    });

    describe('accepting withdraws the overlapping requests of the same client', () => {
      it('withdraws overlapping pending requests of any trainer, with history rows', async () => {
        const trainer = await newTrainer();
        const other = await newTrainer();
        const client = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const target = await newBooking(trainer, client, {
          startsAt: new Date(start),
        });
        const partial = await newBooking(other, client, {
          startsAt: new Date(start + 30 * MINUTE),
        });
        const contained = await newBooking(trainer, client, {
          startsAt: new Date(start + 10 * MINUTE),
          durationMinutes: 15,
        });

        await repository.decide(trainer.id, target, 'accept');

        expect(await statusOf(target)).toBe('confirmed');
        expect(await statusOf(partial)).toBe('withdrawn');
        expect(await statusOf(contained)).toBe('withdrawn');
        expect(await historyOf(partial)).toEqual([
          { from: 'pending', to: 'withdrawn' },
        ]);
        expect(await historyOf(contained)).toEqual([
          { from: 'pending', to: 'withdrawn' },
        ]);
      });

      it('keeps requests whose range only touches the session', async () => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const target = await newBooking(trainer, client, {
          startsAt: new Date(start),
        });
        const before = await newBooking(trainer, client, {
          startsAt: new Date(start - HOUR),
        });
        const after = await newBooking(trainer, client, {
          startsAt: new Date(start + HOUR),
        });

        await repository.decide(trainer.id, target, 'accept');

        expect(await statusOf(before)).toBe('pending');
        expect(await statusOf(after)).toBe('pending');
        expect(await historyOf(before)).toEqual([]);
      });

      it('leaves an overlapping request past its deadline alone', async () => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const target = await newBooking(trainer, client, {
          startsAt: new Date(start),
        });
        const stale = await newBooking(trainer, client, {
          startsAt: new Date(start + 10 * MINUTE),
          requestedAt: new Date(Date.now() - 2 * HOUR),
          expiresAt: new Date(Date.now() - MINUTE),
        });

        await repository.decide(trainer.id, target, 'accept');

        expect(await statusOf(stale)).toBe('pending');
        expect(await historyOf(stale)).toEqual([]);
      });

      it('leaves other clients, other statuses and non-overlapping requests alone', async () => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const otherClient = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const target = await newBooking(trainer, client, {
          startsAt: new Date(start),
        });
        const foreign = await newBooking(trainer, otherClient, {
          startsAt: new Date(start),
        });
        const confirmedOverlap = await newBooking(trainer, client, {
          startsAt: new Date(start),
          status: 'confirmed',
        });
        const far = await newBooking(trainer, client, {
          startsAt: new Date(start + 5 * HOUR),
        });

        await repository.decide(trainer.id, target, 'accept');

        expect(await statusOf(foreign)).toBe('pending');
        expect(await statusOf(confirmedOverlap)).toBe('confirmed');
        expect(await statusOf(far)).toBe('pending');
      });

      it('does not withdraw anything when the request is declined', async () => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const target = await newBooking(trainer, client, {
          startsAt: new Date(start),
        });
        const overlapping = await newBooking(trainer, client, {
          startsAt: new Date(start + 10 * MINUTE),
        });

        await repository.decide(trainer.id, target, 'decline');

        expect(await statusOf(overlapping)).toBe('pending');
      });
    });

    describe('concurrency', () => {
      it('refuses an accept whose deadline passes while it waits for the lock', async () => {
        const trainer = await newTrainer();
        const client = await newUser('client');
        const id = await newBooking(trainer, client, {
          expiresAt: new Date(Date.now() + 1_500),
        });
        const holder = await handle.pool.connect();
        let outcome: Promise<unknown> | undefined;
        try {
          await holder.query('begin');
          await holder.query(
            'select id from bookings where id = $1 for update',
            [id],
          );
          outcome = repository.decide(trainer.id, id, 'accept').then(
            () => 'accepted',
            (error: unknown) => error,
          );
          // The deadline passes while the decision waits for the lock.
          await new Promise((resolve) => setTimeout(resolve, 2_000));
          await holder.query('commit');
        } finally {
          holder.release();
        }

        const error = await outcome;
        expect(error).toBeInstanceOf(BookingConflictException);
        expect(error).toMatchObject({ code: 'booking-expired' });
        expect(await statusOf(id)).toBe('pending');
      });

      it('lets exactly one of two trainers confirm overlapping requests of one client, without a deadlock', async () => {
        for (let round = 0; round < 10; round++) {
          const first = await newTrainer();
          const second = await newTrainer();
          const client = await newUser('client');
          const start = Date.now() + 10 * HOUR;
          const a = await newBooking(first, client, {
            startsAt: new Date(start),
          });
          const b = await newBooking(second, client, {
            startsAt: new Date(start + 15 * MINUTE),
          });

          const results = await Promise.allSettled([
            repository.decide(first.id, a, 'accept'),
            repository.decide(second.id, b, 'accept'),
          ]);

          expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(
            1,
          );
          const rejected = results.find((r) => r.status === 'rejected');
          expect(
            rejected?.status === 'rejected' && rejected.reason,
          ).toMatchObject({ code: 'booking-withdrawn' });
          const statuses = [await statusOf(a), await statusOf(b)].sort();
          expect(statuses).toEqual(['confirmed', 'withdrawn']);
        }
      });

      it('lets two trainers decline and accept different requests of one client side by side', async () => {
        const first = await newTrainer();
        const second = await newTrainer();
        const client = await newUser('client');
        const start = Date.now() + 10 * HOUR;
        const a = await newBooking(first, client, {
          startsAt: new Date(start),
        });
        const b = await newBooking(second, client, {
          startsAt: new Date(start + 5 * HOUR),
        });

        await Promise.all([
          repository.decide(first.id, a, 'decline'),
          repository.decide(second.id, b, 'accept'),
        ]);

        expect(await statusOf(a)).toBe('declined');
        expect(await statusOf(b)).toBe('confirmed');
      });
    });
  });
});
