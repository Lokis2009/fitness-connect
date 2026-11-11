export const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

/** Validated process environment, the only way application code reads configuration. */
export interface Env {
  NODE_ENV: NodeEnv;
  API_PORT: number;
  CORS_ORIGINS: string[];
  DATABASE_URL: string;
  /** Required outside production, where it must not be set to anything meaningful. */
  JWT_DEV_SECRET: string | undefined;
}

export type RawEnv = Record<string, string | undefined>;

/** Thrown with every problem found, so a misconfigured deployment fails fast and completely. */
export class EnvValidationError extends Error {}

const DEFAULT_API_PORT = 3000;
const MIN_DEV_SECRET_LENGTH = 32;

/** Parses and validates the raw environment. Throws {@link EnvValidationError} when invalid. */
export function validateEnv(raw: RawEnv): Env {
  const problems: string[] = [];

  // No default: a deployment that forgets NODE_ENV must not silently run in development mode.
  const nodeEnv = raw['NODE_ENV'] ?? '';
  if (!(NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    problems.push(
      `NODE_ENV is required and must be one of ${NODE_ENVS.join(', ')} (got "${nodeEnv}")`,
    );
  }
  const isProduction = nodeEnv === 'production';

  const rawPort = raw['API_PORT'];
  let port = DEFAULT_API_PORT;
  if (rawPort !== undefined && rawPort !== '') {
    port = Number(rawPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      problems.push(
        `API_PORT must be an integer from 1 to 65535 (got "${rawPort}")`,
      );
    }
  }

  const corsOrigins = (raw['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const databaseUrl = raw['DATABASE_URL']?.trim();
  if (!databaseUrl) {
    problems.push('DATABASE_URL is required');
  } else if (!isPostgresUrl(databaseUrl)) {
    problems.push('DATABASE_URL must be a postgres:// or postgresql:// URL');
  }

  const devSecret = raw['JWT_DEV_SECRET'];
  if (isProduction) {
    if (devSecret) {
      problems.push('JWT_DEV_SECRET must not be set in production');
    }
  } else if (!devSecret?.trim()) {
    problems.push('JWT_DEV_SECRET is required outside production');
  } else if (devSecret.length < MIN_DEV_SECRET_LENGTH) {
    problems.push(
      `JWT_DEV_SECRET must be at least ${MIN_DEV_SECRET_LENGTH} characters`,
    );
  }

  if (problems.length > 0) {
    throw new EnvValidationError(
      `Invalid environment:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }

  return {
    NODE_ENV: nodeEnv as NodeEnv,
    API_PORT: port,
    CORS_ORIGINS: corsOrigins,
    DATABASE_URL: databaseUrl as string,
    JWT_DEV_SECRET: isProduction ? undefined : devSecret,
  };
}

function isPostgresUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'postgres:' || protocol === 'postgresql:';
  } catch {
    return false;
  }
}
