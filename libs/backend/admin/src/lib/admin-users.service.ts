import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@fitness-connect/identity';
import type { UserPageDto } from './admin-user.dto';
import type { ListUsersQuery } from './list-users-query.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly users: UsersRepository) {}

  list(query: ListUsersQuery): Promise<UserPageDto> {
    void this.users;
    void query;
    throw new Error('not implemented');
  }
}
