import { Global, Module } from '@nestjs/common';
import { TOKEN_VERIFIER } from '@fitness-connect/common';
import { IdentityModule } from '../identity.module';
import { DevAuthController } from './dev-auth.controller';
import { DevAuthService } from './dev-auth.service';
import { DevTokenService } from './dev-token.service';

/**
 * Development authentication: the login route and the HS256 verifier the JWT
 * guard uses. The app imports this module only when NODE_ENV is not production.
 */
@Global()
@Module({
  imports: [IdentityModule],
  controllers: [DevAuthController],
  providers: [
    DevAuthService,
    DevTokenService,
    { provide: TOKEN_VERIFIER, useExisting: DevTokenService },
  ],
  exports: [TOKEN_VERIFIER],
})
export class DevAuthModule {}
