import type { AuthUser } from '@fitness-connect/common';
import type { UserRow } from '@fitness-connect/database';
import { UnauthorizedException } from '@nestjs/common';
import { MeController } from './me.controller';
import type { UsersRepository } from './users.repository';

const row: UserRow = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  cognitoSub: 'cognito-sub-1',
  email: 'trainer@example.com',
  displayName: 'Taylor Trainer',
  role: 'trainer',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};
const caller: AuthUser = { id: row.id, email: row.email, role: 'trainer' };

describe('MeController', () => {
  it('returns the user from the database by token subject, in contract shape', async () => {
    const findById = jest.fn().mockResolvedValue(row);
    const controller = new MeController({
      findById,
    } as unknown as UsersRepository);

    const me = await controller.me(caller);

    expect(findById).toHaveBeenCalledWith(caller.id);
    expect(me).toEqual({
      id: row.id,
      email: row.email,
      displayName: 'Taylor Trainer',
      role: 'trainer',
    });
  });

  it('answers 401 when the token is valid but the user no longer exists', async () => {
    const controller = new MeController({
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as UsersRepository);

    await expect(controller.me(caller)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
