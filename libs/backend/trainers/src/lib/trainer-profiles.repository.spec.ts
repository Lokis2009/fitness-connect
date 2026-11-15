import { TrainerProfilesRepository } from './trainer-profiles.repository';

describe('TrainerProfilesRepository', () => {
  const repository = new TrainerProfilesRepository();

  it('findProfile is not implemented yet', () => {
    expect(() => repository.findProfile('id')).toThrow('not implemented');
  });

  it('findOldestVenue is not implemented yet', () => {
    expect(() => repository.findOldestVenue('id')).toThrow('not implemented');
  });
});
