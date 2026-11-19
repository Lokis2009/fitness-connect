import type { UserRow } from '@fitness-connect/database';
import type { TrainerUserFields } from '@fitness-connect/trainers';
import { toUserDto } from './user.dto';

const row: UserRow = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  cognitoSub: 'secret-sub',
  email: 'admin@example.com',
  displayName: 'Alex Admin',
  role: 'admin',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const NO_FIELDS: TrainerUserFields = {
  trainerStatus: null,
  trainerStatusNote: null,
  trainerVenueTimeZone: null,
};

describe('toUserDto', () => {
  it('exposes exactly the contract fields and nothing internal', () => {
    const dto = toUserDto(row, NO_FIELDS);

    expect(dto).toEqual({
      id: row.id,
      email: 'admin@example.com',
      displayName: 'Alex Admin',
      role: 'admin',
      trainerStatus: null,
      trainerStatusNote: null,
      trainerVenueTimeZone: null,
    });
    expect(Object.keys(dto).sort()).toEqual([
      'displayName',
      'email',
      'id',
      'role',
      'trainerStatus',
      'trainerStatusNote',
      'trainerVenueTimeZone',
    ]);
  });

  it('includes the trainer fields of a trainer', () => {
    const dto = toUserDto(
      { ...row, role: 'trainer', email: 'trainer@example.com' },
      {
        trainerStatus: 'changes_requested',
        trainerStatusNote: 'Add a photo',
        trainerVenueTimeZone: 'Europe/Warsaw',
      },
    );

    expect(dto).toMatchObject({
      role: 'trainer',
      trainerStatus: 'changes_requested',
      trainerStatusNote: 'Add a photo',
      trainerVenueTimeZone: 'Europe/Warsaw',
    });
  });
});
