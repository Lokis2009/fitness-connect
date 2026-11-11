import { DynamicModule, Global, Module } from '@nestjs/common';
import type { Env } from './env';

/** Injection token for the validated {@link Env}. */
export const APP_ENV = Symbol('APP_ENV');

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [{ provide: APP_ENV, useValue: env }],
      exports: [APP_ENV],
    };
  }
}
