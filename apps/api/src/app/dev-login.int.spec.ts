import type { INestApplication } from '@nestjs/common';
import { decodeJwt } from 'jose';
import { call, integrationEnv, login, startApp } from '../testing/test-app';

const SEEDED = [
  ['client@example.com', 'client'],
  ['trainer@example.com', 'trainer'],
  ['admin@example.com', 'admin'],
] as const;

describe('POST /v1/dev/login', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    ({ app, url } = await startApp(await integrationEnv()));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(SEEDED)('signs in %s as a %s', async (email, role) => {
    const response = await login(url, email);

    expect(response.status).toBe(200);
    expect(response.contentType).toContain('application/json');
    const body = response.body as {
      accessToken: string;
      user: Record<string, string>;
    };
    expect(body.user).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      email,
      displayName: expect.any(String),
      role,
    });
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'user']);

    expect(decodeJwt(body.accessToken)).toMatchObject({
      sub: body.user['id'],
      email,
      role,
      iss: 'fitness-connect-dev',
    });
    const claims = decodeJwt(body.accessToken);
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(3600);
  });

  it('issues a token the API accepts', async () => {
    const { body } = await login(url, 'trainer@example.com');
    const { accessToken, user } = body as {
      accessToken: string;
      user: unknown;
    };

    const me = await call(url, 'GET', '/v1/me', { token: accessToken });

    expect(me.status).toBe(200);
    expect(me.body).toEqual(user);
  });

  describe('rejects bad credentials with 401 problem details', () => {
    it('for a wrong password', async () => {
      const response = await login(
        url,
        'client@example.com',
        'not-the-password',
      );

      expect(response.status).toBe(401);
      expect(response.contentType).toContain('application/problem+json');
      expect(response.body).toMatchObject({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        instance: '/v1/dev/login',
      });
      expect(JSON.stringify(response.body)).not.toContain('accessToken');
    });

    it('for an unknown user, indistinguishable from a wrong password', async () => {
      const wrongPassword = await login(url, 'client@example.com', 'nope');
      const unknownUser = await login(url, 'ghost@example.com', 'password');

      expect(unknownUser.status).toBe(401);
      expect(unknownUser.contentType).toContain('application/problem+json');
      expect(unknownUser.body).toEqual(wrongPassword.body);
    });
  });

  describe('validates the request body', () => {
    it.each([
      ['an empty body', {}],
      ['a missing password', { email: 'client@example.com' }],
      ['a missing email', { password: 'password' }],
      ['an invalid email', { email: 'not-an-email', password: 'password' }],
      ['a non string password', { email: 'client@example.com', password: 42 }],
      ['an empty password', { email: 'client@example.com', password: '' }],
      [
        'an unknown property',
        { email: 'client@example.com', password: 'password', role: 'admin' },
      ],
    ])('answers 400 problem details for %s', async (_name, body) => {
      const response = await call(url, 'POST', '/v1/dev/login', { body });

      expect(response.status).toBe(400);
      expect(response.contentType).toContain('application/problem+json');
      expect(response.body).toMatchObject({
        title: 'Bad Request',
        status: 400,
        detail: expect.any(String),
      });
    });
  });
});
