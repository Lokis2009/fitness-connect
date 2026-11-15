import type { AuthUser } from '@fitness-connect/common';
import type { UserRow } from '@fitness-connect/database';
import type { TrainersService } from '@fitness-connect/trainers';
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

const trainerFields = {
  trainerStatus: 'approved',
  trainerStatusNote: null,
  trainerVenueTimeZone: 'Europe/Warsaw',
};

function controllerFor(found: UserRow | null, fields = trainerFields) {
  const findById = jest.fn().mockResolvedValue(found);
  const getUserTrainerFields = jest.fn().mockResolvedValue(fields);
  return {
    findById,
    getUserTrainerFields,
    controller: new MeController(
      { findById } as unknown as UsersRepository,
      { getUserTrainerFields } as unknown as TrainersService,
    ),
  };
}

describe('MeController', () => {
  it('returns the user from the database by token subject, with the trainer fields', async () => {
    const { controller, findById, getUserTrainerFields } = controllerFor(row);

    const me = await controller.me(caller);

    expect(findById).toHaveBeenCalledWith(caller.id);
    expect(getUserTrainerFields).toHaveBeenCalledWith({
      id: row.id,
      role: 'trainer',
    });
    expect(me).toEqual({
      id: row.id,
      email: row.email,
      displayName: 'Taylor Trainer',
      role: 'trainer',
      trainerStatus: 'approved',
      trainerStatusNote: null,
      trainerVenueTimeZone: 'Europe/Warsaw',
    });
  });

  it('uses the role stored in the database, not the one in the token', async () => {
    const { controller, getUserTrainerFields } = controllerFor({
      ...row,
      role: 'client',
    });

    await controller.me(caller);

    expect(getUserTrainerFields).toHaveBeenCalledWith({
      id: row.id,
      role: 'client',
    });
  });

  it('answers 401 when the token is valid but the user no longer exists', async () => {
    const { controller, getUserTrainerFields } = controllerFor(null);

    await expect(controller.me(caller)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(getUserTrainerFields).not.toHaveBeenCalled();
  });
});
