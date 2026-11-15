import {
  hashPassword,
  verifyPassword,
  type Env,
} from '@fitness-connect/common';
import type { UserRow } from '@fitness-connect/database';
import type { TrainersService } from '@fitness-connect/trainers';
import { UnauthorizedException } from '@nestjs/common';
import type { UsersRepository } from '../users.repository';
import { DevAuthService } from './dev-auth.service';
import { DevTokenService } from './dev-token.service';

jest.mock('@fitness-connect/common', () => {
  const actual = jest.requireActual<typeof import('@fitness-connect/common')>(
    '@fitness-connect/common',
  );
  return {
    ...actual,
    hashPassword: jest.fn(actual.hashPassword),
    verifyPassword: jest.fn(actual.verifyPassword),
  };
});

const user: UserRow = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  cognitoSub: null,
  email: 'client@example.com',
  displayName: 'Casey Client',
  role: 'client',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const clientFields = {
  trainerStatus: null,
  trainerStatusNote: null,
  trainerVenueTimeZone: null,
};

describe('DevAuthService', () => {
  const getUserTrainerFields = jest.fn().mockResolvedValue(clientFields);
  const trainers = { getUserTrainerFields } as unknown as TrainersService;
  const tokens = new DevTokenService({
    JWT_DEV_SECRET: 'unit-test-secret-of-sufficient-length',
  } as Env);
  let findWithDevCredentials: jest.Mock;
  let service: DevAuthService;

  beforeAll(async () => {
    const passwordHash = await hashPassword('password');
    findWithDevCredentials = jest.fn(async (email: string) =>
      email === user.email ? { user, passwordHash } : null,
    );
    service = new DevAuthService(
      { findWithDevCredentials } as unknown as UsersRepository,
      tokens,
      trainers,
    );
  });

  beforeEach(() => {
    jest.mocked(verifyPassword).mockClear();
  });

  it('returns a verifiable token and the user for valid credentials', async () => {
    const result = await service.login({
      email: user.email,
      password: 'password',
    });

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: 'client',
      trainerStatus: null,
      trainerStatusNote: null,
      trainerVenueTimeZone: null,
    });
    expect(getUserTrainerFields).toHaveBeenCalledWith({
      id: user.id,
      role: 'client',
    });
    await expect(tokens.verify(result.accessToken)).resolves.toEqual({
      id: user.id,
      email: user.email,
      role: 'client',
    });
  });

  it('returns the trainer fields of a trainer', async () => {
    const trainer: UserRow = {
      ...user,
      email: 'trainer@example.com',
      role: 'trainer',
    };
    const passwordHash = await hashPassword('password');
    const fields = {
      trainerStatus: 'submitted',
      trainerStatusNote: null,
      trainerVenueTimeZone: 'Europe/Warsaw',
    };
    const trainerService = new DevAuthService(
      {
        findWithDevCredentials: jest.fn().mockResolvedValue({
          user: trainer,
          passwordHash,
        }),
      } as unknown as UsersRepository,
      tokens,
      {
        getUserTrainerFields: jest.fn().mockResolvedValue(fields),
      } as unknown as TrainersService,
    );

    const result = await trainerService.login({
      email: trainer.email,
      password: 'password',
    });

    expect(result.user).toMatchObject({ role: 'trainer', ...fields });
  });

  it('answers 401 for a wrong password', async () => {
    await expect(
      service.login({ email: user.email, password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('answers 401 for an unknown email, with the same message', async () => {
    const wrongPassword = await service
      .login({ email: user.email, password: 'nope' })
      .catch((e: UnauthorizedException) => e.message);
    const unknownUser = await service
      .login({ email: 'ghost@example.com', password: 'password' })
      .catch((e: UnauthorizedException) => e.message);

    expect(unknownUser).toBe(wrongPassword);
  });

  it('still spends a password check on an unknown email to hide which part failed', async () => {
    await service
      .login({ email: 'ghost@example.com', password: 'password' })
      .catch(() => undefined);

    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it('retries the timing hash after it failed instead of caching the failure', async () => {
    const fresh = new DevAuthService(
      { findWithDevCredentials } as unknown as UsersRepository,
      tokens,
      trainers,
    );
    jest.mocked(hashPassword).mockRejectedValueOnce(new Error('scrypt failed'));

    await expect(
      fresh.login({ email: 'ghost@example.com', password: 'password' }),
    ).rejects.toThrow('scrypt failed');
    await expect(
      fresh.login({ email: 'ghost@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
