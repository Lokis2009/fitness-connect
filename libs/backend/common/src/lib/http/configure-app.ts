import type { INestApplication } from '@nestjs/common';
import type { Env } from '../config/env';

export const API_PREFIX = 'v1';

/**
 * Applies the cross-cutting HTTP setup shared by the real app and the tests:
 * global prefix, validation pipe, problem-details filter and the CORS allow-list.
 */
export function configureApp(
  app: INestApplication,
  env: Pick<Env, 'CORS_ORIGINS'>,
): void {
  void app;
  void env;
  throw new Error('not implemented');
}
