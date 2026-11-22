import { DynamicModule, Module } from '@nestjs/common';
import { AdminModule } from '@fitness-connect/admin';
import { AppConfigModule, AuthModule, type Env } from '@fitness-connect/common';
import { DatabaseModule } from '@fitness-connect/database';
import { BookingModule } from '@fitness-connect/booking';
import { DevAuthModule, IdentityModule } from '@fitness-connect/identity';
import { TrainersModule } from '@fitness-connect/trainers';
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
        TrainersModule,
        BookingModule,
        AdminModule,
        ...(env.NODE_ENV === 'production' ? [] : [DevAuthModule]),
      ],
      controllers: [HealthController],
    };
  }
}
