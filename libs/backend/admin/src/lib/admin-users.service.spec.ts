import type { UserRow } from '@fitness-connect/database';
import type { UsersRepository } from '@fitness-connect/identity';
import { AdminUsersService } from './admin-users.service';

function user(overrides: Partial<UserRow>): UserRow {
  return {
    id: 'c0000000-0000-4000-8000-000000000001',
    cognitoSub: null,
    email: 'client@example.com',
    displayName: 'Casey Client',
    role: 'client',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('AdminUsersService', () => {
  const repository = { listPage: jest.fn() };
  const service = new AdminUsersService(
    repository as unknown as UsersRepository,
  );

  beforeEach(() => jest.resetAllMocks());

  it('asks the repository for the requested page and role', async () => {
    repository.listPage.mockResolvedValue({ rows: [], total: 0 });

    await service.list({ role: 'trainer', page: 2, pageSize: 10 });

    expect(repository.listPage).toHaveBeenCalledWith({
      role: 'trainer',
      page: 2,
      pageSize: 10,
    });
  });

  it('asks for every role when no role is given', async () => {
    repository.listPage.mockResolvedValue({ rows: [], total: 0 });

    await service.list({ page: 1, pageSize: 25 });

    expect(repository.listPage).toHaveBeenCalledWith({
      role: undefined,
      page: 1,
      pageSize: 25,
    });
  });

  it('answers a UserPage with the mapped rows, the total and the paging it was asked for', async () => {
    repository.listPage.mockResolvedValue({
      rows: [
        user({ cognitoSub: 'secret-sub' }),
        user({
          id: 'a0000000-0000-4000-8000-000000000001',
          email: 'admin@example.com',
          displayName: 'Alex Admin',
          role: 'admin',
          createdAt: new Date('2025-12-31T00:00:00Z'),
        }),
      ],
      total: 7,
    });

    await expect(
      service.list({ page: 3, pageSize: 2 }),
    ).resolves.toStrictEqual({
      items: [
        {
          id: 'c0000000-0000-4000-8000-000000000001',
          email: 'client@example.com',
          displayName: 'Casey Client',
          role: 'client',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'a0000000-0000-4000-8000-000000000001',
          email: 'admin@example.com',
          displayName: 'Alex Admin',
          role: 'admin',
          createdAt: '2025-12-31T00:00:00.000Z',
        },
      ],
      total: 7,
      page: 3,
      pageSize: 2,
    });
  });

  it('answers an empty page with the real total past the last page', async () => {
    repository.listPage.mockResolvedValue({ rows: [], total: 4 });

    await expect(
      service.list({ page: 9, pageSize: 25 }),
    ).resolves.toStrictEqual({ items: [], total: 4, page: 9, pageSize: 25 });
  });
});
