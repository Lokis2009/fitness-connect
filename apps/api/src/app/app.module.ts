import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule, AuthModule, type Env } from '@fitness-connect/common';
import { DatabaseModule } from '@fitness-connect/database';
import { DevAuthModule, IdentityModule } from '@fitness-connect/identity';
import { HealthController } from './health.controller';

@Module({})
export class AppModule {
  /**
   * Builds the module graph for a validated environment. The dev module (login
   * route and HS256 verifier) is registered only outside production.
   */
  static forEnv(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.forRoot(env),
        DatabaseModule,
        AuthModule,
        IdentityModule,
        ...(env.NODE_ENV === 'production' ? [] : [DevAuthModule]),
      ],
      controllers: [HealthController],
    };
  }
}
