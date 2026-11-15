import type { UsersService } from '@fitness-connect/identity';
import type { TrainersService } from '@fitness-connect/trainers';
import { BookingService } from './booking.service';
import type { BookingsRepository } from './bookings.repository';

describe('BookingService', () => {
  const service = new BookingService(
    {} as BookingsRepository,
    {} as TrainersService,
    {} as UsersService,
  );

  it('listPendingRequests is not implemented yet', () => {
    expect(() => service.listPendingRequests('id')).toThrow('not implemented');
  });

  it('listSessions is not implemented yet', () => {
    expect(() => service.listSessions('id', new Date(), new Date())).toThrow(
      'not implemented',
    );
  });

  it('accept is not implemented yet', () => {
    expect(() => service.accept('id', 'id')).toThrow('not implemented');
  });

  it('decline is not implemented yet', () => {
    expect(() => service.decline('id', 'id')).toThrow('not implemented');
  });
});
