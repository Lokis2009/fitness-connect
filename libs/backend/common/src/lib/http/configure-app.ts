import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Env } from '../config/env';
import { ProblemDetailsFilter } from './problem-details.filter';

export const API_PREFIX = 'v1';

/**
 * Applies the cross-cutting HTTP setup shared by the real app and the tests:
 * global prefix, validation pipe, problem-details filter and the CORS allow-list.
 */
export function configureApp(
  app: INestApplication,
  env: Pick<Env, 'CORS_ORIGINS'>,
): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableCors({ origin: env.CORS_ORIGINS });
}
