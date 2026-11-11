import { Inject, Injectable } from '@nestjs/common';
import {
  APP_ENV,
  ROLES,
  type AuthUser,
  type Env,
  type Role,
  type TokenVerifier,
} from '@fitness-connect/common';
import { jwtVerify, SignJWT } from 'jose';

export const DEV_JWT_ISSUER = 'fitness-connect-dev';
export const DEV_JWT_TTL = '1h';
const ALGORITHM = 'HS256';

/** Signs and verifies development tokens: HS256 with JWT_DEV_SECRET. */
@Injectable()
export class DevTokenService implements TokenVerifier {
  constructor(@Inject(APP_ENV) private readonly env: Env) {}

  async sign(user: AuthUser): Promise<string> {
    return new SignJWT({ email: user.email, role: user.role })
      .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(DEV_JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(DEV_JWT_TTL)
      .sign(this.key());
  }

  async verify(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, this.key(), {
      issuer: DEV_JWT_ISSUER,
      algorithms: [ALGORITHM],
      requiredClaims: ['exp'],
    });

    const { sub, email, role } = payload;
    if (typeof sub !== 'string' || typeof email !== 'string' || !isRole(role)) {
      throw new Error('Token is missing required claims');
    }
    return { id: sub, email, role };
  }

  private key(): Uint8Array {
    const secret = this.env.JWT_DEV_SECRET;
    if (!secret) {
      throw new Error('JWT_DEV_SECRET is not configured');
    }
    return new TextEncoder().encode(secret);
  }
}

function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' && (ROLES as readonly string[]).includes(value)
  );
}
