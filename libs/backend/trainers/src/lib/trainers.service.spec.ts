import type { Role } from '@fitness-connect/common';
import type {
  TrainerProfileRow,
  TrainerProfilesRepository,
  VenueRow,
} from './trainer-profiles.repository';
import { TrainersService } from './trainers.service';

const profile = (
  status: TrainerProfileRow['status'],
  statusNote: string | null = null,
): TrainerProfileRow => ({ userId: 'u-1', status, statusNote });
const venue: VenueRow = {
  id: 'v-1',
  trainerUserId: 'u-1',
  name: 'Iron Hall Gym',
  area: 'Powisle',
  timeZone: 'Europe/Warsaw',
};

function serviceWith(
  repository: Partial<Record<keyof TrainerProfilesRepository, jest.Mock>>,
) {
  const repo = {
    findProfile: jest.fn().mockResolvedValue(null),
    findOldestVenue: jest.fn().mockResolvedValue(null),
    findVenuesByIds: jest.fn().mockResolvedValue([]),
    ...repository,
  };
  return {
    repo,
    service: new TrainersService(repo as unknown as TrainerProfilesRepository),
  };
}

describe('TrainersService', () => {
  describe('getUserTrainerFields', () => {
    it.each<Role>(['client', 'admin'])(
      'returns all null for a %s without reading the database',
      async (role) => {
        const { service, repo } = serviceWith({});

        await expect(
          service.getUserTrainerFields({ id: 'u-1', role }),
        ).resolves.toEqual({
          trainerStatus: null,
          trainerStatusNote: null,
          trainerVenueTimeZone: null,
        });
        expect(repo.findProfile).not.toHaveBeenCalled();
        expect(repo.findOldestVenue).not.toHaveBeenCalled();
      },
    );

    it('reads a trainer without a profile row as incomplete with no venue zone', async () => {
      const { service } = serviceWith({});

      await expect(
        service.getUserTrainerFields({ id: 'u-1', role: 'trainer' }),
      ).resolves.toEqual({
        trainerStatus: 'incomplete',
        trainerStatusNote: null,
        trainerVenueTimeZone: null,
      });
    });

    it.each([
      'incomplete',
      'submitted',
      'changes_requested',
      'approved',
    ] as const)(
      'returns status %s with the note and the venue zone',
      async (status) => {
        const { service, repo } = serviceWith({
          findProfile: jest.fn().mockResolvedValue(profile(status, 'A note')),
          findOldestVenue: jest.fn().mockResolvedValue(venue),
        });

        await expect(
          service.getUserTrainerFields({ id: 'u-1', role: 'trainer' }),
        ).resolves.toEqual({
          trainerStatus: status,
          trainerStatusNote: 'A note',
          trainerVenueTimeZone: 'Europe/Warsaw',
        });
        expect(repo.findProfile).toHaveBeenCalledWith('u-1');
        expect(repo.findOldestVenue).toHaveBeenCalledWith('u-1');
      },
    );

    it('returns a null note when the profile has none', async () => {
      const { service } = serviceWith({
        findProfile: jest.fn().mockResolvedValue(profile('submitted')),
      });

      const fields = await service.getUserTrainerFields({
        id: 'u-1',
        role: 'trainer',
      });

      expect(fields.trainerStatusNote).toBeNull();
    });
  });

  describe('isApproved', () => {
    it('is true for the approved status', async () => {
      const { service } = serviceWith({
        findProfile: jest.fn().mockResolvedValue(profile('approved')),
      });

      await expect(service.isApproved('u-1')).resolves.toBe(true);
    });

    it.each(['incomplete', 'submitted', 'changes_requested'] as const)(
      'is false for %s',
      async (status) => {
        const { service } = serviceWith({
          findProfile: jest.fn().mockResolvedValue(profile(status)),
        });

        await expect(service.isApproved('u-1')).resolves.toBe(false);
      },
    );

    it('is false when there is no profile row', async () => {
      const { service } = serviceWith({});

      await expect(service.isApproved('u-1')).resolves.toBe(false);
    });
  });

  describe('venuesByIds', () => {
    it('returns summaries keyed by id, without the address or other columns', async () => {
      const { service, repo } = serviceWith({
        findVenuesByIds: jest.fn().mockResolvedValue([venue]),
      });

      const venues = await service.venuesByIds(['v-1']);

      expect(repo.findVenuesByIds).toHaveBeenCalledWith(['v-1']);
      expect(venues).toEqual(
        new Map([
          [
            'v-1',
            {
              name: 'Iron Hall Gym',
              area: 'Powisle',
              timeZone: 'Europe/Warsaw',
            },
          ],
        ]),
      );
    });

    it('answers an empty list without querying', async () => {
      const { service, repo } = serviceWith({});

      await expect(service.venuesByIds([])).resolves.toEqual(new Map());
      expect(repo.findVenuesByIds).not.toHaveBeenCalled();
    });
  });
});
