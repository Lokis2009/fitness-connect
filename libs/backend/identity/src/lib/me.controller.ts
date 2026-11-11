import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '@fitness-connect/common';
import { UsersRepository } from './users.repository';
import type { UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  me(@CurrentUser() caller: AuthUser): Promise<UserDto> {
    void this.users;
    void caller;
    throw new Error('not implemented');
  }
}
