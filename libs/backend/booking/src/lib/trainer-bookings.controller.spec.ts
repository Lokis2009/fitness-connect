import type { AuthUser } from '@fitness-connect/common';
import type { BookingService } from './booking.service';
import { TrainerBookingsController } from './trainer-bookings.controller';

const caller: AuthUser = { id: 'trainer-1', email: 'a@b.c', role: 'trainer' };

describe('TrainerBookingsController', () => {
  const bookings = {
    listPendingRequests: jest.fn(),
    listSessions: jest.fn(),
  };
  const controller = new TrainerBookingsController(
    bookings as unknown as BookingService,
  );

  beforeEach(() => jest.resetAllMocks());

  it('bookingRequests lists the pending requests of the caller', async () => {
    const list = { serverTime: '2031-03-10T10:00:00.000Z', items: [] };
    bookings.listPendingRequests.mockResolvedValue(list);

    await expect(controller.bookingRequests(caller)).resolves.toBe(list);

    expect(bookings.listPendingRequests).toHaveBeenCalledWith('trainer-1');
  });

  it('sessions lists the sessions of the caller in the range as dates', async () => {
    const list = { serverTime: '2031-03-10T10:00:00.000Z', items: [] };
    bookings.listSessions.mockResolvedValue(list);

    await expect(
      controller.sessions(caller, {
        from: '2031-03-10T00:00:00+01:00',
        to: '2031-03-12T00:00:00Z',
      }),
    ).resolves.toBe(list);

    expect(bookings.listSessions).toHaveBeenCalledWith(
      'trainer-1',
      new Date('2031-03-09T23:00:00Z'),
      new Date('2031-03-12T00:00:00Z'),
    );
  });
});
