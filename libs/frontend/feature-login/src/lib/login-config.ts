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
