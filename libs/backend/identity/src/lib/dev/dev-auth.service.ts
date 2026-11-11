import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { DevTokenService } from './dev-token.service';
import type { DevLoginDto, DevLoginResponseDto } from './dev-login.dto';

@Injectable()
export class DevAuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: DevTokenService,
  ) {}

  /** Checks the dev credentials and issues a token. Throws 401 on any mismatch. */
  login(credentials: DevLoginDto): Promise<DevLoginResponseDto> {
    void this.users;
    void this.tokens;
    void credentials;
    throw new Error('not implemented');
  }
}
