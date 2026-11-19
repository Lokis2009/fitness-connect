import {
  createDatabase,
  prepareTestDatabase,
  trainerProfiles,
  users,
  venues,
  type DatabaseHandle,
} from '@fitness-connect/database';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { TrainerProfilesRepository } from './trainer-profiles.repository';

describe('TrainerProfilesRepository (real database)', () => {
  let handle: DatabaseHandle;
  let repository: TrainerProfilesRepository;

  async function userId(email: string): Promise<string> {
    const [row] = await handle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    return row.id;
  }

  async function newTrainer(): Promise<string> {
    const [row] = await handle.db
      .insert(users)
      .values({
        email: `trainer-${randomUUID()}@example.com`,
        displayName: 'Temp Trainer',
        role: 'trainer',
      })
      .returning({ id: users.id });
    return row.id;
  }

  beforeAll(async () => {
    const url = await prepareTestDatabase('fitness_connect_test_trainers');
    handle = createDatabase(url);
    repository = new TrainerProfilesRepository(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  describe('findProfile', () => {
    it('returns the stored status and note of a seeded trainer', async () => {
      const id = await userId('trainer@example.com');

      await expect(repository.findProfile(id)).resolves.toEqual({
        userId: id,
        status: 'approved',
        statusNote: null,
      });
    });

    it('returns a stored note', async () => {
      const id = await newTrainer();
      await handle.db.insert(trainerProfiles).values({
        userId: id,
        status: 'changes_requested',
        statusNote: 'Fix it',
      });

      await expect(repository.findProfile(id)).resolves.toEqual({
        userId: id,
        status: 'changes_requested',
        statusNote: 'Fix it',
      });
    });

    it('returns null when the trainer has no profile row', async () => {
      await expect(
        repository.findProfile(await newTrainer()),
      ).resolves.toBeNull();
    });

    it('returns null, not a database error, for an id that is not a uuid', async () => {
      await expect(repository.findProfile('not-a-uuid')).resolves.toBeNull();
    });
  });

  describe('findOldestVenue', () => {
    it('returns the venue of a seeded trainer', async () => {
      await expect(
        repository.findOldestVenue(await userId('trainer@example.com')),
      ).resolves.toMatchObject({
        name: 'Iron Hall Gym',
        area: 'Powisle',
        timeZone: 'Europe/Warsaw',
      });
    });

    it('returns the oldest venue by created_at when there are several', async () => {
      const id = await newTrainer();
      const venue = { trainerUserId: id, area: 'Area', address: 'Street 1' };
      await handle.db.insert(venues).values([
        {
          ...venue,
          name: 'Newer',
          timeZone: 'Europe/London',
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
        {
          ...venue,
          name: 'Oldest',
          timeZone: 'Europe/Berlin',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      await expect(repository.findOldestVenue(id)).resolves.toMatchObject({
        name: 'Oldest',
        timeZone: 'Europe/Berlin',
        trainerUserId: id,
      });
    });

    it('returns null when the trainer has no venue', async () => {
      await expect(
        repository.findOldestVenue(await newTrainer()),
      ).resolves.toBeNull();
    });

    it('returns null for an id that is not a uuid', async () => {
      await expect(repository.findOldestVenue('nope')).resolves.toBeNull();
    });
  });

  describe('findVenuesByIds', () => {
    it('returns the venues with the given ids and no address', async () => {
      const venue = await repository.findOldestVenue(
        await userId('trainer@example.com'),
      );

      const found = await repository.findVenuesByIds([
        venue?.id ?? '',
        randomUUID(),
        'not-a-uuid',
      ]);

      expect(found).toHaveLength(1);
      expect(found[0]).toEqual(venue);
      expect(found[0]).not.toHaveProperty('address');
    });

    it('returns an empty list for no usable ids', async () => {
      await expect(repository.findVenuesByIds([])).resolves.toEqual([]);
      await expect(repository.findVenuesByIds(['x'])).resolves.toEqual([]);
    });
  });
});
