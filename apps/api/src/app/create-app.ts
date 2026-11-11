import type { INestApplication } from '@nestjs/common';
import type { Env } from '@fitness-connect/common';

/** Creates the fully configured API application for a validated environment. */
export async function createApp(env: Env): Promise<INestApplication> {
  void env;
  throw new Error('not implemented');
}
