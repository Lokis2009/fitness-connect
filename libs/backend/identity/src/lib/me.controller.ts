import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '@fitness-connect/common';
import { UsersRepository } from './users.repository';
import { toUserDto, type UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  async me(@CurrentUser() caller: AuthUser): Promise<UserDto> {
    const user = await this.users.findById(caller.id);
    if (!user) {
      // The token is valid but its user is gone.
      throw new UnauthorizedException();
    }
    return toUserDto(user);
  }
}
