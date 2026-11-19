import type { AuthUser } from '@fitness-connect/common';
import type { BookingService } from './booking.service';
import { BookingsController } from './bookings.controller';

const caller: AuthUser = { id: 'trainer-1', email: 'a@b.c', role: 'trainer' };

describe('BookingsController', () => {
  const bookings = { accept: jest.fn(), decline: jest.fn() };
  const controller = new BookingsController(
    bookings as unknown as BookingService,
  );
  const booking = {
    id: 'b-1',
    status: 'confirmed',
    startsAt: '2031-03-10T11:30:00.000Z',
    decidedAt: '2031-03-10T10:20:00.000Z',
  };

  beforeEach(() => jest.resetAllMocks());

  it('accept passes the caller and the id to the service', async () => {
    bookings.accept.mockResolvedValue(booking);

    await expect(controller.accept(caller, 'b-1')).resolves.toBe(booking);

    expect(bookings.accept).toHaveBeenCalledWith('trainer-1', 'b-1');
  });

  it('decline passes the caller and the id to the service', async () => {
    bookings.decline.mockResolvedValue({ ...booking, status: 'declined' });

    await expect(controller.decline(caller, 'b-1')).resolves.toMatchObject({
      status: 'declined',
    });

    expect(bookings.decline).toHaveBeenCalledWith('trainer-1', 'b-1');
  });
});
