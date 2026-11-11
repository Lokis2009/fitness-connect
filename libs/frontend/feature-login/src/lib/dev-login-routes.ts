import { isDevMode } from '@angular/core';
import type { Route } from '@angular/router';

/**
 * The `dev-login` route, only in development mode. Production builds replace this file with
 * `dev-login-routes.production.ts`, which drops the route and its lazy chunk from the bundle.
 */
export function devLoginRoutes(data: Route['data']): Route[] {
  if (!isDevMode()) {
    return [];
  }
  return [
    {
      path: 'dev-login',
      data,
      loadComponent: () =>
        import('./dev-login-page').then((m) => m.DevLoginPage),
    },
  ];
}
