import type { UserRow } from '@fitness-connect/database';
import { toUserDto } from './user.dto';

describe('toUserDto', () => {
  it('exposes exactly the contract fields and nothing internal', () => {
    const row: UserRow = {
      id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
      cognitoSub: 'secret-sub',
      email: 'admin@example.com',
      displayName: 'Alex Admin',
      role: 'admin',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    const dto = toUserDto(row);

    expect(dto).toEqual({
      id: row.id,
      email: 'admin@example.com',
      displayName: 'Alex Admin',
      role: 'admin',
    });
    expect(Object.keys(dto).sort()).toEqual([
      'displayName',
      'email',
      'id',
      'role',
    ]);
  });
});
