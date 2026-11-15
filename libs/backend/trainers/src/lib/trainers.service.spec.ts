import type { TrainerProfilesRepository } from './trainer-profiles.repository';
import { TrainersService } from './trainers.service';

describe('TrainersService', () => {
  const service = new TrainersService({} as TrainerProfilesRepository);

  it('getUserTrainerFields is not implemented yet', () => {
    expect(() =>
      service.getUserTrainerFields({ id: 'id', role: 'trainer' }),
    ).toThrow('not implemented');
  });

  it('isApproved is not implemented yet', () => {
    expect(() => service.isApproved('id')).toThrow('not implemented');
  });

  it('venuesByIds is not implemented yet', () => {
    expect(() => service.venuesByIds([])).toThrow('not implemented');
  });
});
