export const E2E_DATABASE_NAME = 'fitness_connect_e2e';
export const E2E_DATABASE_URL = `postgres://fitness:fitness@localhost:5432/${E2E_DATABASE_NAME}`;
export const ADMIN_DATABASE_URL = 'postgres://fitness:fitness@localhost:5432/postgres';

export const API_PORT = 3000;

export const API_ENV: Record<string, string> = {
  NODE_ENV: 'development',
  API_PORT: String(API_PORT),
  CORS_ORIGINS: 'http://localhost:4200,http://localhost:4201,http://localhost:4202',
  DATABASE_URL: E2E_DATABASE_URL,
  JWT_DEV_SECRET: 'e2e-only-secret-that-is-long-enough-for-hs256',
};
