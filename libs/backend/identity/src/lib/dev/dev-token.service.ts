import { Inject, Injectable } from '@nestjs/common';
import {
  APP_ENV,
  type AuthUser,
  type Env,
  type TokenVerifier,
} from '@fitness-connect/common';

export const DEV_JWT_ISSUER = 'fitness-connect-dev';
export const DEV_JWT_TTL = '1h';

/** Signs and verifies development tokens: HS256 with JWT_DEV_SECRET. */
@Injectable()
export class DevTokenService implements TokenVerifier {
  constructor(@Inject(APP_ENV) private readonly env: Env) {}

  sign(user: AuthUser): Promise<string> {
    void this.env;
    void user;
    throw new Error('not implemented');
  }

  verify(token: string): Promise<AuthUser> {
    void token;
    throw new Error('not implemented');
  }
}
