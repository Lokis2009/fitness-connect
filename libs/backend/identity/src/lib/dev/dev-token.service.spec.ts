import type { AuthUser, Env } from '@fitness-connect/common';
import { decodeJwt, decodeProtectedHeader, SignJWT } from 'jose';
import {
  DEV_JWT_ISSUER,
  DEV_JWT_TTL,
  DevTokenService,
} from './dev-token.service';

const SECRET = 'unit-test-secret-of-sufficient-length';
const key = (secret: string) => new TextEncoder().encode(secret);

const caller: AuthUser = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  email: 'trainer@example.com',
  role: 'trainer',
};

function service(...args: [] | [secret: string | undefined]) {
  const secret = args.length === 0 ? SECRET : args[0];
  return new DevTokenService({ JWT_DEV_SECRET: secret } as Env);
}

/** A token that is valid except for what `override` changes. */
function craft(
  claims: Record<string, unknown>,
  options: {
    secret?: string;
    alg?: string;
    issuer?: string;
    expiresAt?: number | string;
  } = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: options.alg ?? 'HS256' })
    .setIssuer(options.issuer ?? DEV_JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(options.expiresAt ?? '1h')
    .sign(key(options.secret ?? SECRET));
}

const goodClaims = { sub: caller.id, email: caller.email, role: caller.role };

describe('DevTokenService', () => {
  it('uses the documented issuer and lifetime', () => {
    expect(DEV_JWT_ISSUER).toBe('fitness-connect-dev');
    expect(DEV_JWT_TTL).toBe('1h');
  });

  describe('sign', () => {
    it('issues an HS256 JWT with sub, role, email and issuer', async () => {
      const token = await service().sign(caller);

      expect(decodeProtectedHeader(token)).toMatchObject({
        alg: 'HS256',
        typ: 'JWT',
      });
      expect(decodeJwt(token)).toMatchObject({
        sub: caller.id,
        role: 'trainer',
        email: caller.email,
        iss: 'fitness-connect-dev',
      });
    });

    it('expires after one hour', async () => {
      const claims = decodeJwt(await service().sign(caller));

      expect(claims.iat).toBeDefined();
      expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(3600);
    });

    it('refuses to sign without a dev secret', async () => {
      await expect(service(undefined).sign(caller)).rejects.toThrow(
        /JWT_DEV_SECRET/,
      );
    });
  });

  describe('verify', () => {
    it('returns the caller for a token it signed', async () => {
      const dev = service();

      await expect(dev.verify(await dev.sign(caller))).resolves.toEqual(caller);
    });

    it('accepts a correctly crafted token', async () => {
      await expect(service().verify(await craft(goodClaims))).resolves.toEqual(
        caller,
      );
    });

    it('rejects an expired token', async () => {
      const expired = await craft(goodClaims, {
        expiresAt: Math.floor(Date.now() / 1000) - 60,
      });

      await expect(service().verify(expired)).rejects.toThrow();
    });

    it('rejects a token signed with another secret', async () => {
      const forged = await craft(goodClaims, {
        secret: 'another-secret-value!!',
      });

      await expect(service().verify(forged)).rejects.toThrow();
    });

    it('rejects a token whose payload was tampered with', async () => {
      const [header, , signature] = (await craft(goodClaims)).split('.');
      const payload = Buffer.from(
        JSON.stringify({ ...goodClaims, role: 'admin', iss: DEV_JWT_ISSUER }),
      ).toString('base64url');

      await expect(
        service().verify(`${header}.${payload}.${signature}`),
      ).rejects.toThrow();
    });

    it('rejects an unsigned token (alg none)', async () => {
      const enc = (value: object) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
      const unsigned = `${enc({ alg: 'none', typ: 'JWT' })}.${enc({
        ...goodClaims,
        iss: DEV_JWT_ISSUER,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })}.`;

      await expect(service().verify(unsigned)).rejects.toThrow();
    });

    it('rejects algorithms other than HS256', async () => {
      const hs512 = await craft(goodClaims, { alg: 'HS512' });

      await expect(service().verify(hs512)).rejects.toThrow();
    });

    it('rejects a token from another issuer', async () => {
      const other = await craft(goodClaims, { issuer: 'someone-else' });

      await expect(service().verify(other)).rejects.toThrow();
    });

    it.each([
      ['sub', { email: caller.email, role: caller.role }],
      ['email', { sub: caller.id, role: caller.role }],
      ['role', { sub: caller.id, email: caller.email }],
      ['a known role', { ...goodClaims, role: 'superuser' }],
      ['a string email', { ...goodClaims, email: 42 }],
    ])('rejects a token without %s', async (_name, claims) => {
      await expect(service().verify(await craft(claims))).rejects.toThrow(
        /claims/i,
      );
    });

    it.each(['', 'not-a-jwt', 'a.b.c'])('rejects garbage %p', async (token) => {
      await expect(service().verify(token)).rejects.toThrow();
    });

    it('refuses to verify without a dev secret', async () => {
      await expect(service(undefined).verify('a.b.c')).rejects.toThrow(
        /JWT_DEV_SECRET/,
      );
    });
  });
});
