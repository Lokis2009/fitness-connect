import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword } from '@fitness-connect/common';
import { randomUUID } from 'node:crypto';
import { toUserDto } from '../user.dto';
import { UsersRepository } from '../users.repository';
import { DevTokenService } from './dev-token.service';
import type { DevLoginDto, DevLoginResponseDto } from './dev-login.dto';

@Injectable()
export class DevAuthService {
  /** Checked against when the email is unknown, so both failures cost the same time. */
  private unknownUserHash?: Promise<string>;

  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: DevTokenService,
  ) {}

  /** Checks the dev credentials and issues a token. Throws 401 on any mismatch. */
  async login({ email, password }: DevLoginDto): Promise<DevLoginResponseDto> {
    const found = await this.users.findWithDevCredentials(email);
    const matches = await verifyPassword(
      password,
      found?.passwordHash ?? (await this.timingHash()),
    );
    if (!found || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { user } = found;
    const accessToken = await this.tokens.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, user: toUserDto(user) };
  }

  /** Computed once; a failed attempt is discarded so a later login can retry it. */
  private timingHash(): Promise<string> {
    this.unknownUserHash ??= hashPassword(randomUUID()).catch(
      (error: unknown) => {
        this.unknownUserHash = undefined;
        throw error;
      },
    );
    return this.unknownUserHash;
  }
}
