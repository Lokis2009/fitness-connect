import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@fitness-connect/identity';
import { toAdminUserDto, type UserPageDto } from './admin-user.dto';
import type { ListUsersQuery } from './list-users-query.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly users: UsersRepository) {}

  async list({ role, page, pageSize }: ListUsersQuery): Promise<UserPageDto> {
    const { rows, total } = await this.users.listPage({ role, page, pageSize });
    return { items: rows.map(toAdminUserDto), total, page, pageSize };
  }
}
