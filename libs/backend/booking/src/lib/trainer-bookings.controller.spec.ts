import type { AuthUser } from '@fitness-connect/common';
import { TrainerBookingsController } from './trainer-bookings.controller';
import type { BookingService } from './booking.service';

const caller: AuthUser = { id: 'id', email: 'a@b.c', role: 'trainer' };

describe('TrainerBookingsController', () => {
  const controller = new TrainerBookingsController({} as BookingService);

  it('bookingRequests is not implemented yet', () => {
    expect(() => controller.bookingRequests(caller)).toThrow('not implemented');
  });

  it('sessions is not implemented yet', () => {
    expect(() => controller.sessions(caller, { from: '', to: '' })).toThrow(
      'not implemented',
    );
  });
});
