import type { EnvironmentProviders } from '@angular/core';
import { provideDevAuth } from './provide-dev-auth';

/**
 * Authentication providers of the apps. Development builds use the dev login. Production builds
 * replace this file with `provide-app-auth.production.ts` (`fileReplacements` in each app's
 * `project.json`), so the dev auth code never reaches the production bundle.
 */
export function provideAppAuth(): EnvironmentProviders {
  return provideDevAuth();
}
