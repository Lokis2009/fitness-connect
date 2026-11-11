import type { INestApplication } from '@nestjs/common';
import {
  documentedStatuses,
  loadContract,
  requestSchema,
  responseSchema,
} from '../testing/contract';
import { validateSchema } from '../testing/json-schema';
import {
  type ApiResponse,
  call,
  integrationEnv,
  startApp,
  tokenFor,
} from '../testing/test-app';

/** Checks status, media type and body of a real response against the OpenAPI contract. */
function expectConforms(
  response: ApiResponse,
  method: 'GET' | 'POST',
  path: string,
) {
  expect(documentedStatuses(method, path)).toContain(String(response.status));

  const mediaType =
    response.status >= 400 ? 'application/problem+json' : 'application/json';
  expect(response.contentType).toContain(mediaType);

  const schema = responseSchema(method, path, response.status, mediaType);
  expect(schema).toBeDefined();
  // Strict: a field the contract does not declare must not leak out.
  expect(validateSchema(schema ?? {}, response.body, { strict: true })).toEqual(
    [],
  );
}

describe('API conformance to the OpenAPI contract', () => {
  let app: INestApplication;
  let url: string;
  let token: string;

  beforeAll(async () => {
    ({ app, url } = await startApp(await integrationEnv()));
    token = await tokenFor(url, 'client@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves every path the contract defines', async () => {
    const contract = loadContract();
    for (const [path, operations] of Object.entries(contract.paths)) {
      for (const method of Object.keys(operations)) {
        const response = await call(
          url,
          method.toUpperCase() as 'GET' | 'POST',
          `/v1${path}`,
          { body: method === 'post' ? {} : undefined },
        );
        expect([method, path, response.status === 404]).toEqual([
          method,
          path,
          false,
        ]);
      }
    }
  });

  it('GET /health', async () => {
    expectConforms(await call(url, 'GET', '/v1/health'), 'GET', '/health');
  });

  describe('POST /dev/login', () => {
    const request = { email: 'client@example.com', password: 'password' };

    it('sends a request body that matches the contract', () => {
      expect(
        validateSchema(requestSchema('POST', '/dev/login'), request, {
          strict: true,
        }),
      ).toEqual([]);
      expect(
        validateSchema(
          requestSchema('POST', '/dev/login'),
          { email: 'x' },
          { strict: true },
        ),
      ).not.toEqual([]);
    });

    it('200 returns a DevLoginResponse', async () => {
      const response = await call(url, 'POST', '/v1/dev/login', {
        body: request,
      });

      expect(response.status).toBe(200);
      expectConforms(response, 'POST', '/dev/login');
    });

    it('401 returns a Problem', async () => {
      const response = await call(url, 'POST', '/v1/dev/login', {
        body: { ...request, password: 'wrong' },
      });

      expect(response.status).toBe(401);
      expectConforms(response, 'POST', '/dev/login');
    });
  });

  describe('GET /me', () => {
    it('200 returns a User', async () => {
      const response = await call(url, 'GET', '/v1/me', { token });

      expect(response.status).toBe(200);
      expectConforms(response, 'GET', '/me');
    });

    it('401 returns a Problem', async () => {
      const response = await call(url, 'GET', '/v1/me');

      expect(response.status).toBe(401);
      expectConforms(response, 'GET', '/me');
    });
  });
});
