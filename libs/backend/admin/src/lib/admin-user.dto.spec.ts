import type { UserRow } from '@fitness-connect/database';
import { toAdminUserDto } from './admin-user.dto';

const row: UserRow = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  cognitoSub: 'secret-sub',
  email: 'trainer@example.com',
  displayName: 'Taylor Trainer',
  role: 'trainer',
  createdAt: new Date('2026-01-02T03:04:05.678Z'),
};

describe('toAdminUserDto', () => {
  it('exposes exactly the contract fields, with createdAt as an ISO string', () => {
    expect(toAdminUserDto(row)).toStrictEqual({
      id: row.id,
      email: 'trainer@example.com',
      displayName: 'Taylor Trainer',
      role: 'trainer',
      createdAt: '2026-01-02T03:04:05.678Z',
    });
  });

  it('leaves out the cognito subject', () => {
    expect(toAdminUserDto(row)).not.toHaveProperty('cognitoSub');
  });
});
