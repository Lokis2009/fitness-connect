import type { Route } from '@angular/router';

/** Production counterpart of `dev-login-routes.ts`: there is no dev login. */
export function devLoginRoutes(data: Route['data']): Route[] {
  void data;
  throw new Error('not implemented');
}
