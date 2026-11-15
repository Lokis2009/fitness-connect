import { Logger, NotFoundException } from '@nestjs/common';
import type { UsersService } from '@fitness-connect/identity';
import type { TrainersService } from '@fitness-connect/trainers';
import { BookingService } from './booking.service';
import {
  BookingConflictException,
  type BookingRow,
  type BookingsRepository,
} from './bookings.repository';

const NOW = Date.parse('2031-03-10T10:00:00Z');
const TRAINER = 'f0000000-0000-4000-8000-000000000001';
const CLIENT_A = 'c0000000-0000-4000-8000-00000000000a';
const CLIENT_B = 'c0000000-0000-4000-8000-00000000000b';
const VENUE_A = 'e0000000-0000-4000-8000-00000000000a';
const VENUE_B = 'e0000000-0000-4000-8000-00000000000b';
const VENUE = {
  name: 'Iron Hall Gym',
  area: 'Powisle',
  timeZone: 'Europe/Warsaw',
};

function row(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'b0000000-0000-4000-8000-000000000001',
    trainerUserId: TRAINER,
    clientUserId: CLIENT_A,
    venueId: VENUE_A,
    startsAt: new Date(NOW + 90 * 60_000),
    durationMinutes: 60,
    priceMinor: 12000,
    currency: 'PLN',
    status: 'pending',
    requestedAt: new Date(NOW - 5 * 60_000),
    expiresAt: new Date(NOW + 55 * 60_000),
    decidedAt: null,
    ...overrides,
  };
}

describe('BookingService', () => {
  const bookings = {
    pendingForTrainer: jest.fn(),
    sessionsForTrainer: jest.fn(),
    decide: jest.fn(),
  };
  const users = { displayNames: jest.fn() };
  const trainers = { venuesByIds: jest.fn() };
  let service: BookingService;
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    users.displayNames.mockResolvedValue(
      new Map([
        [CLIENT_A, 'Casey Client'],
        [CLIENT_B, 'Robin Client'],
      ]),
    );
    trainers.venuesByIds.mockResolvedValue(
      new Map([
        [VENUE_A, VENUE],
        [VENUE_B, { ...VENUE, name: 'Second Gym' }],
      ]),
    );
    service = new BookingService(
      bookings as unknown as BookingsRepository,
      trainers as unknown as TrainersService,
      users as unknown as UsersService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listPendingRequests', () => {
    it('merges client names and venues into the requests, one batched lookup each', async () => {
      const serverTime = new Date(NOW);
      bookings.pendingForTrainer.mockResolvedValue({
        rows: [
          row({ id: 'b0000000-0000-4000-8000-000000000001' }),
          row({
            id: 'b0000000-0000-4000-8000-000000000002',
            clientUserId: CLIENT_B,
            venueId: VENUE_B,
          }),
          row({ id: 'b0000000-0000-4000-8000-000000000003' }),
        ],
        serverTime,
      });

      const result = await service.listPendingRequests(TRAINER);

      expect(bookings.pendingForTrainer).toHaveBeenCalledWith(TRAINER);
      expect(users.displayNames).toHaveBeenCalledTimes(1);
      expect(users.displayNames).toHaveBeenCalledWith([CLIENT_A, CLIENT_B]);
      expect(trainers.venuesByIds).toHaveBeenCalledTimes(1);
      expect(trainers.venuesByIds).toHaveBeenCalledWith([VENUE_A, VENUE_B]);
      expect(result.serverTime).toBe(serverTime.toISOString());
      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toEqual({
        id: 'b0000000-0000-4000-8000-000000000001',
        clientName: 'Casey Client',
        startsAt: new Date(NOW + 90 * 60_000).toISOString(),
        durationMinutes: 60,
        priceMinor: 12000,
        currency: 'PLN',
        venue: VENUE,
        requestedAt: new Date(NOW - 5 * 60_000).toISOString(),
        expiresAt: new Date(NOW + 55 * 60_000).toISOString(),
      });
      expect(result.items[1]).toMatchObject({
        clientName: 'Robin Client',
        venue: { name: 'Second Gym' },
      });
    });

    it('returns an empty list with the server time when there are no requests', async () => {
      bookings.pendingForTrainer.mockResolvedValue({
        rows: [],
        serverTime: new Date(NOW),
      });

      await expect(service.listPendingRequests(TRAINER)).resolves.toEqual({
        serverTime: new Date(NOW).toISOString(),
        items: [],
      });
    });

    it('fails when a client name is missing', async () => {
      bookings.pendingForTrainer.mockResolvedValue({
        rows: [row()],
        serverTime: new Date(NOW),
      });
      users.displayNames.mockResolvedValue(new Map());

      await expect(service.listPendingRequests(TRAINER)).rejects.toThrow(
        'client',
      );
    });

    it('fails when a venue is missing', async () => {
      bookings.pendingForTrainer.mockResolvedValue({
        rows: [row()],
        serverTime: new Date(NOW),
      });
      trainers.venuesByIds.mockResolvedValue(new Map());

      await expect(service.listPendingRequests(TRAINER)).rejects.toThrow(
        'venue',
      );
    });
  });

  describe('listSessions', () => {
    it('maps confirmed rows to sessions without a price', async () => {
      const from = new Date('2031-03-10T00:00:00Z');
      const to = new Date('2031-03-12T00:00:00Z');
      bookings.sessionsForTrainer.mockResolvedValue({
        rows: [row({ status: 'confirmed' })],
        serverTime: new Date(NOW),
      });

      const result = await service.listSessions(TRAINER, from, to);

      expect(bookings.sessionsForTrainer).toHaveBeenCalledWith(
        TRAINER,
        from,
        to,
      );
      expect(result).toEqual({
        serverTime: new Date(NOW).toISOString(),
        items: [
          {
            id: 'b0000000-0000-4000-8000-000000000001',
            clientName: 'Casey Client',
            startsAt: new Date(NOW + 90 * 60_000).toISOString(),
            durationMinutes: 60,
            venue: VENUE,
          },
        ],
      });
      expect(result.items[0]).not.toHaveProperty('priceMinor');
    });
  });

  describe.each(['accept', 'decline'] as const)('%s', (action) => {
    const id = 'b0000000-0000-4000-8000-000000000001';
    const logged = () =>
      log.mock.calls.map(([message]) => JSON.parse(message as string));

    it('returns the updated booking and logs one JSON line', async () => {
      const decidedAt = new Date(NOW);
      bookings.decide.mockResolvedValue({
        booking: row({
          status: action === 'accept' ? 'confirmed' : 'declined',
          decidedAt,
        }),
        repeat: false,
      });

      const result = await service[action](TRAINER, id);

      expect(bookings.decide).toHaveBeenCalledWith(TRAINER, id, action);
      expect(result).toEqual({
        id,
        status: action === 'accept' ? 'confirmed' : 'declined',
        startsAt: new Date(NOW + 90 * 60_000).toISOString(),
        decidedAt: decidedAt.toISOString(),
      });
      expect(log).toHaveBeenCalledTimes(1);
      expect(logged()).toEqual([
        {
          event: 'booking.decided',
          bookingId: id,
          trainerId: TRAINER,
          action,
          result: 'ok',
          secondsToDeadline: 55 * 60,
          minutesToStart: 90,
        },
      ]);
    });

    it('logs a repeat as repeat', async () => {
      bookings.decide.mockResolvedValue({
        booking: row({
          status: action === 'accept' ? 'confirmed' : 'declined',
          decidedAt: new Date(NOW - 1000),
        }),
        repeat: true,
      });

      await service[action](TRAINER, id);

      expect(logged()[0]).toMatchObject({ result: 'repeat' });
    });

    it('logs a conflict with its code at log level and rethrows it', async () => {
      const conflict = new BookingConflictException(
        'booking-expired',
        'The request has expired.',
        row({ expiresAt: new Date(NOW - 30_000) }),
      );
      bookings.decide.mockRejectedValue(conflict);

      await expect(service[action](TRAINER, id)).rejects.toBe(conflict);

      expect(logged()).toEqual([
        {
          event: 'booking.decided',
          bookingId: id,
          trainerId: TRAINER,
          action,
          result: 'booking-expired',
          secondsToDeadline: -30,
          minutesToStart: 90,
        },
      ]);
    });

    it('logs a missing booking as not-found and rethrows it', async () => {
      const missing = new NotFoundException();
      bookings.decide.mockRejectedValue(missing);

      await expect(service[action](TRAINER, id)).rejects.toBe(missing);

      expect(logged()).toEqual([
        {
          event: 'booking.decided',
          bookingId: id,
          trainerId: TRAINER,
          action,
          result: 'not-found',
          secondsToDeadline: null,
          minutesToStart: null,
        },
      ]);
    });

    it('rethrows an unexpected error without logging a decision', async () => {
      const failure = new Error('connection lost');
      bookings.decide.mockRejectedValue(failure);

      await expect(service[action](TRAINER, id)).rejects.toBe(failure);

      expect(log).not.toHaveBeenCalled();
    });
  });
});
