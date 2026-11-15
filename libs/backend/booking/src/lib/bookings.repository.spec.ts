import type { Database } from '@fitness-connect/database';
import { BookingsRepository } from './bookings.repository';

describe('BookingsRepository', () => {
  const repository = new BookingsRepository({} as Database);

  it('pendingForTrainer is not implemented yet', () => {
    expect(() => repository.pendingForTrainer('id')).toThrow('not implemented');
  });

  it('sessionsForTrainer is not implemented yet', () => {
    expect(() =>
      repository.sessionsForTrainer('id', new Date(), new Date()),
    ).toThrow('not implemented');
  });

  it('decide is not implemented yet', () => {
    expect(() => repository.decide('id', 'id', 'accept')).toThrow(
      'not implemented',
    );
  });
});
