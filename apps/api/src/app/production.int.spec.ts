import type { INestApplication } from '@nestjs/common';
import { TOKEN_VERIFIER } from '@fitness-connect/common';
import { DevAuthController } from '@fitness-connect/identity';
import { call, integrationEnv, mintToken, startApp } from '../testing/test-app';

describe('dev authentication is development only', () => {
  describe('in production mode', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
      // Production has no dev secret: validateEnv rejects one.
      const env = await integrationEnv({
        NODE_ENV: 'production',
        JWT_DEV_SECRET: undefined,
      });
      ({ app, url } = await startApp(env));
    });

    afterAll(async () => {
      await app.close();
    });

    it('has no POST /v1/dev/login route', async () => {
      const response = await call(url, 'POST', '/v1/dev/login', {
        body: { email: 'client@example.com', password: 'password' },
      });

      expect(response.status).toBe(404);
      expect(response.contentType).toContain('application/problem+json');
      expect(JSON.stringify(response.body)).not.toContain('accessToken');
    });

    it('does not register the dev controller or the dev token verifier', () => {
      expect(() => app.get(DevAuthController, { strict: false })).toThrow();
      expect(() => app.get(TOKEN_VERIFIER, { strict: false })).toThrow();
    });

    it('still serves public routes', async () => {
      expect((await call(url, 'GET', '/v1/health')).status).toBe(200);
    });

    it('does not accept a dev signed token on protected routes', async () => {
      // Even a token signed with the secret the dev verifier would use.
      const token = await mintToken({
        sub: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
        email: 'admin@example.com',
        role: 'admin',
      });

      const response = await call(url, 'GET', '/v1/me', { token });

      expect(response.status).toBe(401);
    });
  });

  describe('outside production', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
      ({ app, url } = await startApp(await integrationEnv()));
    });

    afterAll(async () => {
      await app.close();
    });

    it('registers the dev controller and the verifier', async () => {
      expect(app.get(DevAuthController, { strict: false })).toBeDefined();
      expect(app.get(TOKEN_VERIFIER, { strict: false })).toBeDefined();
      const response = await call(url, 'POST', '/v1/dev/login', { body: {} });
      expect(response.status).toBe(400);
    });
  });
});
