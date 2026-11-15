import type { AuthUser } from '@fitness-connect/common';
import { BookingsController } from './bookings.controller';
import type { BookingService } from './booking.service';

const caller: AuthUser = { id: 'id', email: 'a@b.c', role: 'trainer' };

describe('BookingsController', () => {
  const controller = new BookingsController({} as BookingService);

  it('accept is not implemented yet', () => {
    expect(() => controller.accept(caller, 'id')).toThrow('not implemented');
  });

  it('decline is not implemented yet', () => {
    expect(() => controller.decline(caller, 'id')).toThrow('not implemented');
  });
});
