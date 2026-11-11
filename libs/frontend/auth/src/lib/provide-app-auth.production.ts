import type { EnvironmentProviders } from '@angular/core';

/** Production counterpart of `provide-app-auth.ts`: no dev login, no dev auth service. */
export function provideAppAuth(): EnvironmentProviders {
  throw new Error('not implemented');
}
