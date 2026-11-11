import type { INestApplication } from '@nestjs/common';
import { call, integrationEnv, startApp } from '../testing/test-app';

describe('GET /v1/health', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    ({ app, url } = await startApp(await integrationEnv()));
  });

  afterAll(async () => {
    await app.close();
  });

  it('is public and answers { status: "ok" }', async () => {
    const response = await call(url, 'GET', '/v1/health');

    expect(response.status).toBe(200);
    expect(response.contentType).toContain('application/json');
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('is only served under the v1 prefix', async () => {
    expect((await call(url, 'GET', '/health')).status).toBe(404);
  });

  it('allows CORS for the configured origins only', async () => {
    const allowed = await fetch(`${url}/v1/health`, {
      headers: { origin: 'http://localhost:4200' },
    });
    const other = await fetch(`${url}/v1/health`, {
      headers: { origin: 'http://evil.example' },
    });

    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:4200',
    );
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
