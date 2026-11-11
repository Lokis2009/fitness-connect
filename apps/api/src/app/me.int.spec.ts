import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configureApp, Roles, type Env } from '@fitness-connect/common';
import { createDatabase, users } from '@fitness-connect/database';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import {
  call,
  integrationEnv,
  login,
  mintToken,
  startApp,
  tokenFor,
} from '../testing/test-app';

const SEEDED = [
  ['client@example.com', 'client'],
  ['trainer@example.com', 'trainer'],
  ['admin@example.com', 'admin'],
] as const;

/** A protected route that only admins may call, to exercise the roles guard end to end. */
@Controller('probe')
class AdminProbeController {
  @Roles('admin')
  @Get('admin')
  admin() {
    return { ok: true };
  }
}

function expectUnauthorized(response: Awaited<ReturnType<typeof call>>) {
  expect(response.status).toBe(401);
  expect(response.contentType).toContain('application/problem+json');
  expect(response.body).toMatchObject({
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
  });
}

describe('GET /v1/me', () => {
  let env: Env;
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    env = await integrationEnv();
    ({ app, url } = await startApp(env));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(SEEDED)('returns %s from the database', async (email, role) => {
    const { body } = await login(url, email);
    const { accessToken, user } = body as {
      accessToken: string;
      user: { id: string };
    };

    const response = await call(url, 'GET', '/v1/me', { token: accessToken });

    expect(response.status).toBe(200);
    expect(response.contentType).toContain('application/json');
    expect(response.body).toEqual({
      id: user.id,
      email,
      displayName: expect.any(String),
      role,
    });
  });

  it('answers 401 problem details without a token', async () => {
    const response = await call(url, 'GET', '/v1/me');

    expectUnauthorized(response);
    expect(response.body).toMatchObject({ instance: '/v1/me' });
  });

  it.each([
    ['a non bearer scheme', 'Basic Y2xpZW50OnBhc3N3b3Jk'],
    ['a bearer header without a token', 'Bearer'],
    ['a token that is not a jwt', 'Bearer not-a-jwt'],
  ])('answers 401 for %s', async (_name, authorization) => {
    expectUnauthorized(await call(url, 'GET', '/v1/me', { authorization }));
  });

  describe('with an invalid token', () => {
    let claims: { sub: string; email: string; role: string };

    beforeAll(async () => {
      const { body } = await login(url, 'client@example.com');
      const { user } = body as { user: { id: string } };
      claims = { sub: user.id, email: 'client@example.com', role: 'client' };
    });

    it('answers 401 for an expired token', async () => {
      const token = await mintToken(claims, {
        expiresAt: Math.floor(Date.now() / 1000) - 60,
      });

      expectUnauthorized(await call(url, 'GET', '/v1/me', { token }));
    });

    it('answers 401 for a tampered token', async () => {
      const token = await tokenFor(url, 'client@example.com');
      const [header, , signature] = token.split('.');
      const payload = Buffer.from(
        JSON.stringify({
          ...claims,
          role: 'admin',
          iss: 'fitness-connect-dev',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url');

      expectUnauthorized(
        await call(url, 'GET', '/v1/me', {
          token: `${header}.${payload}.${signature}`,
        }),
      );
    });

    it('answers 401 for a token signed with another secret', async () => {
      const token = await mintToken(claims, { secret: 'some-other-secret!!' });

      expectUnauthorized(await call(url, 'GET', '/v1/me', { token }));
    });

    it('answers 401 for a token from another issuer', async () => {
      const token = await mintToken(claims, { issuer: 'someone-else' });

      expectUnauthorized(await call(url, 'GET', '/v1/me', { token }));
    });
  });

  it('answers 401 once the user behind a valid token is gone', async () => {
    const { db, pool } = createDatabase(env.DATABASE_URL);
    try {
      const email = `temp-${randomUUID()}@example.com`;
      const [temp] = await db
        .insert(users)
        .values({ email, displayName: 'Temp', role: 'client' })
        .returning({ id: users.id });
      const token = await mintToken({ sub: temp.id, email, role: 'client' });

      expect((await call(url, 'GET', '/v1/me', { token })).status).toBe(200);

      await db.delete(users).where(eq(users.id, temp.id));

      expectUnauthorized(await call(url, 'GET', '/v1/me', { token }));
    } finally {
      await pool.end();
    }
  });
});

describe('role guard', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const env = await integrationEnv();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forEnv(env)],
      controllers: [AdminProbeController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, env);
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 401 without a token', async () => {
    expectUnauthorized(await call(url, 'GET', '/v1/probe/admin'));
  });

  it.each(['client@example.com', 'trainer@example.com'])(
    'answers 403 problem details for %s',
    async (email) => {
      const token = await tokenFor(url, email);

      const response = await call(url, 'GET', '/v1/probe/admin', { token });

      expect(response.status).toBe(403);
      expect(response.contentType).toContain('application/problem+json');
      expect(response.body).toMatchObject({ title: 'Forbidden', status: 403 });
    },
  );

  it('lets an admin through', async () => {
    const token = await tokenFor(url, 'admin@example.com');

    const response = await call(url, 'GET', '/v1/probe/admin', { token });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
