import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configureApp, type Env } from '@fitness-connect/common';
import { AppModule } from './app.module';

/** Creates the fully configured API application for a validated environment. */
export async function createApp(env: Env): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forEnv(env), {
    // Keep test output quiet; every other environment uses Nest's default logger.
    logger: env.NODE_ENV === 'test' ? false : undefined,
    // Startup errors reject instead of aborting the process; main.ts logs them and exits.
    abortOnError: false,
  });
  configureApp(app, env);
  return app;
}
