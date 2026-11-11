import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AuthService } from './auth-service';
import { DevAuthService } from './dev-auth-service';

/**
 * Wires `DevAuthService` as `AuthService` and restores the session before the
 * app starts. Call it only in non-production configurations.
 */
export function provideDevAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthService, useExisting: DevAuthService },
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ]);
}
