import {
  createDatabase,
  prepareTestDatabase,
  users,
  type DatabaseHandle,
} from '@fitness-connect/database';
import { inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { UsersService } from './users.service';

describe('UsersService (real database)', () => {
  let handle: DatabaseHandle;
  let service: UsersService;

  beforeAll(async () => {
    const url = await prepareTestDatabase('fitness_connect_test_identity');
    handle = createDatabase(url);
    service = new UsersService(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  describe('displayNames', () => {
    it('maps each known id to its display name', async () => {
      const seeded = await handle.db
        .select({ id: users.id, displayName: users.displayName })
        .from(users)
        .where(
          inArray(users.email, ['client@example.com', 'trainer@example.com']),
        );

      const names = await service.displayNames(seeded.map((u) => u.id));

      expect(names).toEqual(new Map(seeded.map((u) => [u.id, u.displayName])));
      expect([...names.values()].sort()).toEqual([
        'Casey Client',
        'Taylor Trainer',
      ]);
    });

    it('leaves out unknown and malformed ids', async () => {
      const [client] = await handle.db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, ['client@example.com']));

      const names = await service.displayNames([
        client.id,
        randomUUID(),
        'not-a-uuid',
      ]);

      expect([...names.keys()]).toEqual([client.id]);
    });

    it('answers an empty map for no ids', async () => {
      await expect(service.displayNames([])).resolves.toEqual(new Map());
    });

    it('asks for each id once even when it is repeated', async () => {
      const [client] = await handle.db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, ['client@example.com']));

      const names = await service.displayNames([client.id, client.id]);

      expect(names.size).toBe(1);
    });
  });
});
