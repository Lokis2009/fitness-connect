import { AdminUsersController } from './admin-users.controller';
import type { AdminUsersService } from './admin-users.service';

describe('AdminUsersController', () => {
  const users = { list: jest.fn() };
  const controller = new AdminUsersController(
    users as unknown as AdminUsersService,
  );

  beforeEach(() => jest.resetAllMocks());

  it('list answers the page the service builds for the query', async () => {
    const page = { items: [], total: 0, page: 1, pageSize: 25 };
    users.list.mockResolvedValue(page);
    const query = { role: 'admin' as const, page: 1, pageSize: 25 };

    await expect(controller.list(query)).resolves.toBe(page);

    expect(users.list).toHaveBeenCalledWith(query);
  });
});
