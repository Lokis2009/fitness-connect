import { isDevMode } from '@angular/core';
import type { Route } from '@angular/router';
import { LOGIN_CONFIG_DATA_KEY, type LoginConfig } from './login-config';

/**
 * Routes `login` and, in development mode only, `dev-login`. Both carry `config` in route data
 * and load their page lazily.
 */
export function loginRoutes(config: LoginConfig): Route[] {
  const data = { [LOGIN_CONFIG_DATA_KEY]: config };
  const routes: Route[] = [
    {
      path: 'login',
      data,
      loadComponent: () => import('./login-page').then((m) => m.LoginPage),
    },
  ];

  if (isDevMode()) {
    routes.push({
      path: 'dev-login',
      data,
      loadComponent: () =>
        import('./dev-login-page').then((m) => m.DevLoginPage),
    });
  }

  return routes;
}
