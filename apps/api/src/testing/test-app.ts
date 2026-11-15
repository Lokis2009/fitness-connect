import type { INestApplication } from '@nestjs/common';
import type { Env } from '@fitness-connect/common';
import {
  createDatabase,
  DEV_PASSWORD,
  prepareTestDatabase,
  seedDevTrainerData,
} from '@fitness-connect/database';
import { SignJWT } from 'jose';
import { createApp } from '../app/create-app';

export const TEST_DATABASE_NAME = 'fitness_connect_test';
export const TEST_JWT_SECRET =
  'integration-test-secret-of-at-least-32-characters';

/**
 * An environment pointing at a migrated and seeded test database,
 * `fitness_connect_test` unless `databaseName` says otherwise. A spec that
 * changes bookings uses a database of its own, so parallel specs do not
 * disturb each other.
 */
export async function integrationEnv(
  overrides: Partial<Env> = {},
  databaseName = TEST_DATABASE_NAME,
): Promise<Env> {
  return {
    NODE_ENV: 'test',
    API_PORT: 0,
    CORS_ORIGINS: ['http://localhost:4200'],
    DATABASE_URL: await prepareTestDatabase(databaseName),
    JWT_DEV_SECRET: TEST_JWT_SECRET,
    ...overrides,
  };
}

/**
 * Restores the trainer data of the dev seed, relative to `now`: both trainer
 * profiles, the venue, and the four bookings of `trainer@example.com`. Their
 * pending requests expire one hour after they were made, so a spec that reads
 * them calls this first. It replaces the seeded trainers' bookings, so only
 * use it on a database that no other spec writes to.
 */
export async function seedTrainerData(
  env: Env,
  now: Date = new Date(),
): Promise<void> {
  const { db, pool } = createDatabase(env.DATABASE_URL);
  try {
    await seedDevTrainerData(db, now);
  } finally {
    await pool.end();
  }
}

export interface RunningApp {
  app: INestApplication;
  url: string;
}

/** Starts the real application (as `main.ts` does) on a random local port. */
export async function startApp(env: Env): Promise<RunningApp> {
  const app = await createApp(env);
  await app.listen(0, '127.0.0.1');
  return { app, url: await app.getUrl() };
}

export interface ApiResponse {
  status: number;
  contentType: string;
  body: unknown;
}

/** Sends a request and parses the JSON body. */
export async function call(
  url: string,
  method: 'GET' | 'POST',
  path: string,
  options: { token?: string; authorization?: string; body?: unknown } = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};
  const authorization =
    options.authorization ??
    (options.token ? `Bearer ${options.token}` : undefined);
  if (authorization) headers['authorization'] = authorization;
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(`${url}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    body: text ? JSON.parse(text) : undefined,
  };
}

export async function login(
  url: string,
  email: string,
  password = DEV_PASSWORD,
) {
  return call(url, 'POST', '/v1/dev/login', { body: { email, password } });
}

export async function tokenFor(url: string, email: string): Promise<string> {
  const { body } = await login(url, email);
  return (body as { accessToken: string }).accessToken;
}

/** Mints a dev-style token with full control over claims, for negative tests. */
export function mintToken(
  claims: Record<string, unknown>,
  options: {
    secret?: string;
    expiresAt?: number | string;
    issuer?: string;
  } = {},
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(options.issuer ?? 'fitness-connect-dev')
    .setIssuedAt()
    .setExpirationTime(options.expiresAt ?? '1h')
    .sign(new TextEncoder().encode(options.secret ?? TEST_JWT_SECRET));
}
