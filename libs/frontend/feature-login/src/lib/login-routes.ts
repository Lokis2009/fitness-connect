import type { Route } from '@angular/router';
import { devLoginRoutes } from './dev-login-routes';
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

  routes.push(...devLoginRoutes(data));

  return routes;
}
