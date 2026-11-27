import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@fitness-connect/common';
import type { UserPageDto } from './admin-user.dto';
import { AdminUsersService } from './admin-users.service';
// Value import on purpose: the validation pipe reads the class from decorator metadata.
import { ListUsersQuery } from './list-users-query.dto';

@Controller('admin/users')
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery): Promise<UserPageDto> {
    return this.users.list(query);
  }
}
