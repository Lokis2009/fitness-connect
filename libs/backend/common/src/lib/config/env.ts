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

/** Parses and validates the raw environment. Throws {@link EnvValidationError} when invalid. */
export function validateEnv(raw: RawEnv): Env {
  void raw;
  throw new Error('not implemented');
}
