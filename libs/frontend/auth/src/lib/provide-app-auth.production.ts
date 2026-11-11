import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { AuthService } from './auth-service';
import { UnconfiguredAuthService } from './unconfigured-auth-service';

/** Production counterpart of `provide-app-auth.ts`: no dev login, no dev auth service. */
export function provideAppAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthService, useExisting: UnconfiguredAuthService },
  ]);
}
