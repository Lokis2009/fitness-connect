import type {
  TrainerProfileRow,
  VenueRow,
} from './trainer-profiles.repository';
import { toTrainerUserFields } from './trainer-user-fields';

const profile: TrainerProfileRow = {
  userId: 'u-1',
  status: 'changes_requested',
  statusNote: 'Add a photo',
};
const venue: VenueRow = {
  id: 'v-1',
  trainerUserId: 'u-1',
  name: 'Iron Hall Gym',
  area: 'Powisle',
  timeZone: 'Europe/Warsaw',
};

describe('toTrainerUserFields', () => {
  it('maps the stored status, note and venue zone', () => {
    expect(toTrainerUserFields(profile, venue)).toEqual({
      trainerStatus: 'changes_requested',
      trainerStatusNote: 'Add a photo',
      trainerVenueTimeZone: 'Europe/Warsaw',
    });
  });

  it('reads a missing profile as incomplete with no note', () => {
    expect(toTrainerUserFields(null, venue)).toEqual({
      trainerStatus: 'incomplete',
      trainerStatusNote: null,
      trainerVenueTimeZone: 'Europe/Warsaw',
    });
  });

  it('has a null venue zone while the trainer has no venue', () => {
    expect(toTrainerUserFields({ ...profile, statusNote: null }, null)).toEqual(
      {
        trainerStatus: 'changes_requested',
        trainerStatusNote: null,
        trainerVenueTimeZone: null,
      },
    );
  });
});
