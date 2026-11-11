import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { Inject } from '@nestjs/common';
import { APP_ENV, type Env } from '@fitness-connect/common';
import { createDatabase, type DatabaseHandle } from './client';

/** Injection token for the Drizzle {@link Database}. */
export const DATABASE = Symbol('DATABASE');
const DATABASE_HANDLE = Symbol('DATABASE_HANDLE');

/** Global module providing one pooled Drizzle instance, closed on shutdown. */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE_HANDLE,
      inject: [APP_ENV],
      useFactory: (env: Env): DatabaseHandle =>
        createDatabase(env.DATABASE_URL),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_HANDLE],
      useFactory: (handle: DatabaseHandle) => handle.db,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_HANDLE) private readonly handle: { pool: Pool },
  ) {}

  async onApplicationShutdown(): Promise<void> {
    void this.handle;
    throw new Error('not implemented');
  }
}
