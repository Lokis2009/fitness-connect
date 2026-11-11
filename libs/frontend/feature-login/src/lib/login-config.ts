import type { Role } from '@fitness-connect/auth';

/** Per-app settings for the login pages, passed to `loginRoutes` and carried in route `data`. */
export interface LoginConfig {
  /** Heading of the landing page. */
  title: string;
  /** Optional text below the heading. */
  description?: string;
  /** Role the app is for; accounts with another role cannot sign in. */
  expectedRole: Role;
  /** Where to go after sign-in when there is no (valid) `returnUrl`. */
  homePath: string;
}

/** Key under which `loginRoutes` stores the `LoginConfig` in route `data`. */
export const LOGIN_CONFIG_DATA_KEY = 'loginConfig';

/**
 * Reads the `LoginConfig` from the current route's data (injection context only).
 *
 * @throws Error when the route has no config, which means it was not created by `loginRoutes`.
 */
export function injectLoginConfig(): LoginConfig {
  throw new Error('not implemented');
}
