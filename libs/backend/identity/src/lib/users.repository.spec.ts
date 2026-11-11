import { verifyPassword } from '@fitness-connect/common';
import {
  createDatabase,
  prepareTestDatabase,
  users,
  type DatabaseHandle,
} from '@fitness-connect/database';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from './users.repository';

describe('UsersRepository (real database)', () => {
  let handle: DatabaseHandle;
  let repository: UsersRepository;

  beforeAll(async () => {
    const url = await prepareTestDatabase('fitness_connect_test_identity');
    handle = createDatabase(url);
    repository = new UsersRepository(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  describe('findById', () => {
    it('returns the stored user', async () => {
      const found = await repository.findWithDevCredentials(
        'trainer@example.com',
      );

      const user = await repository.findById(found?.user.id ?? '');

      expect(user).toMatchObject({
        email: 'trainer@example.com',
        role: 'trainer',
      });
    });

    it('returns null for an id that does not exist', async () => {
      await expect(repository.findById(randomUUID())).resolves.toBeNull();
    });

    it('returns null, not a database error, for an id that is not a uuid', async () => {
      await expect(repository.findById('not-a-uuid')).resolves.toBeNull();
    });
  });

  describe('findWithDevCredentials', () => {
    it('returns the user with a password hash that accepts the dev password', async () => {
      const found =
        await repository.findWithDevCredentials('client@example.com');

      expect(found?.user).toMatchObject({
        email: 'client@example.com',
        role: 'client',
      });
      await expect(
        verifyPassword('password', found?.passwordHash ?? ''),
      ).resolves.toBe(true);
    });

    it('matches the email regardless of case', async () => {
      const found = await repository.findWithDevCredentials(
        'Client@Example.COM',
      );

      expect(found?.user.email).toBe('client@example.com');
    });

    it('returns null for an unknown email', async () => {
      await expect(
        repository.findWithDevCredentials('ghost@example.com'),
      ).resolves.toBeNull();
    });

    it('returns null for a user that has no dev credentials', async () => {
      const email = `nocreds-${randomUUID()}@example.com`;
      await handle.db
        .insert(users)
        .values({ email, displayName: 'No Creds', role: 'client' });

      await expect(
        repository.findWithDevCredentials(email),
      ).resolves.toBeNull();
    });
  });
});
