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
  seedTrainerData,
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
  let trainerToken: string;
  let unapprovedToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Its own database: the booking cases below change the seeded bookings.
    const env = await integrationEnv({}, 'fitness_connect_test_contract');
    await seedTrainerData(env);
    ({ app, url } = await startApp(env));
    token = await tokenFor(url, 'client@example.com');
    trainerToken = await tokenFor(url, 'trainer@example.com');
    unapprovedToken = await tokenFor(url, 'pat.pending@example.com');
    adminToken = await tokenFor(url, 'admin@example.com');
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

  it('keeps the trainerStatus values of User in step with TrainerStatus', () => {
    // User inlines the list, because the test validator has no oneOf and cannot express a nullable
    // $ref. This spec stops the two lists from drifting apart.
    const { components } = loadContract() as unknown as {
      components: {
        schemas: {
          User: { properties: { trainerStatus: { enum: (string | null)[] } } };
          TrainerStatus: { enum: string[] };
        };
      };
    };

    const inlined = components.schemas.User.properties.trainerStatus.enum.filter(
      (value) => value !== null,
    );
    expect(inlined).toEqual(components.schemas.TrainerStatus.enum);
    expect(components.schemas.User.properties.trainerStatus.enum).toContain(null);
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

  describe('GET /admin/users', () => {
    const path = '/admin/users';

    it('200 returns a UserPage', async () => {
      const response = await call(url, 'GET', `/v1${path}`, {
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(
        (response.body as { items: unknown[] }).items.length,
      ).toBeGreaterThan(0);
      expectConforms(response, 'GET', path);
    });

    it('400 returns a Problem for a bad page size', async () => {
      const response = await call(url, 'GET', `/v1${path}?pageSize=101`, {
        token: adminToken,
      });

      expect(response.status).toBe(400);
      expectConforms(response, 'GET', path);
    });

    it('401 returns a Problem', async () => {
      const response = await call(url, 'GET', `/v1${path}`);

      expect(response.status).toBe(401);
      expectConforms(response, 'GET', path);
    });

    it('403 returns a Problem for a client and for a trainer', async () => {
      for (const forbidden of [token, trainerToken]) {
        const response = await call(url, 'GET', `/v1${path}`, {
          token: forbidden,
        });

        expect(response.status).toBe(403);
        expectConforms(response, 'GET', path);
      }
    });
  });

  describe('GET /trainers/me/booking-requests', () => {
    const path = '/trainers/me/booking-requests';

    it('200 returns a BookingRequestList', async () => {
      const response = await call(url, 'GET', `/v1${path}`, {
        token: trainerToken,
      });

      expect(response.status).toBe(200);
      expect((response.body as { items: unknown[] }).items).toHaveLength(2);
      expectConforms(response, 'GET', path);
    });

    it('401 returns a Problem', async () => {
      const response = await call(url, 'GET', `/v1${path}`);

      expect(response.status).toBe(401);
      expectConforms(response, 'GET', path);
    });

    it('403 returns a Problem for a client', async () => {
      const response = await call(url, 'GET', `/v1${path}`, { token });

      expect(response.status).toBe(403);
      expectConforms(response, 'GET', path);
    });

    it('403 returns a Problem with a code for an unapproved trainer', async () => {
      const response = await call(url, 'GET', `/v1${path}`, {
        token: unapprovedToken,
      });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ code: 'trainer-not-approved' });
      expectConforms(response, 'GET', path);
    });
  });

  describe('GET /trainers/me/sessions', () => {
    const path = '/trainers/me/sessions';

    function range(): string {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const to = new Date(Date.now() + 72 * 60 * 60 * 1000);
      return `?from=${from.toISOString()}&to=${to.toISOString()}`;
    }

    it('200 returns a SessionList', async () => {
      const response = await call(url, 'GET', `/v1${path}${range()}`, {
        token: trainerToken,
      });

      expect(response.status).toBe(200);
      expect((response.body as { items: unknown[] }).items).toHaveLength(2);
      expectConforms(response, 'GET', path);
    });

    it('400 returns a Problem for a bad range', async () => {
      const response = await call(
        url,
        'GET',
        `/v1${path}?from=2031-03-10&to=2031-03-11`,
        { token: trainerToken },
      );

      expect(response.status).toBe(400);
      expectConforms(response, 'GET', path);
    });

    it('401 returns a Problem', async () => {
      const response = await call(url, 'GET', `/v1${path}${range()}`);

      expect(response.status).toBe(401);
      expectConforms(response, 'GET', path);
    });

    it('403 returns a Problem for a client and for an unapproved trainer', async () => {
      for (const forbidden of [token, unapprovedToken]) {
        const response = await call(url, 'GET', `/v1${path}${range()}`, {
          token: forbidden,
        });

        expect(response.status).toBe(403);
        expectConforms(response, 'GET', path);
      }
    });
  });

  describe.each(['accept', 'decline'] as const)(
    'POST /bookings/{id}/%s',
    (action) => {
      const path = `/bookings/{id}/${action}`;
      const post = (id: string, bearer?: string) =>
        call(url, 'POST', `/v1/bookings/${id}/${action}`, { token: bearer });

      async function pendingId(): Promise<string> {
        const { body } = await call(
          url,
          'GET',
          '/v1/trainers/me/booking-requests',
          { token: trainerToken },
        );
        return (body as { items: { id: string }[] }).items[0].id;
      }

      it('200 returns a Booking, and 409 returns a Problem once the opposite answer was given', async () => {
        const id = await pendingId();

        const answered = await post(id, trainerToken);

        expect(answered.status).toBe(200);
        expectConforms(answered, 'POST', path);

        const opposite = await call(
          url,
          'POST',
          `/v1/bookings/${id}/${action === 'accept' ? 'decline' : 'accept'}`,
          { token: trainerToken },
        );
        expect(opposite.status).toBe(409);
        expect(opposite.body).toMatchObject({ code: 'booking-not-pending' });
        expectConforms(opposite, 'POST', path);
      });

      it('401 returns a Problem', async () => {
        const response = await post('b0000000-0000-4000-8000-000000000001');

        expect(response.status).toBe(401);
        expectConforms(response, 'POST', path);
      });

      it('403 returns a Problem for a client and for an unapproved trainer', async () => {
        for (const forbidden of [token, unapprovedToken]) {
          const response = await post(
            'b0000000-0000-4000-8000-000000000001',
            forbidden,
          );

          expect(response.status).toBe(403);
          expectConforms(response, 'POST', path);
        }
      });

      it('404 returns a Problem for an unknown and for a malformed id', async () => {
        for (const id of ['b0000000-0000-4000-8000-000000000001', 'nope']) {
          const response = await post(id, trainerToken);

          expect(response.status).toBe(404);
          expectConforms(response, 'POST', path);
        }
      });
    },
  );
});
