import type { Route } from '@angular/router';
import type { LoginConfig } from './login-config';

/** Routes `login` and (in development only) `dev-login`, both carrying `config` in route data. */
export function loginRoutes(config: LoginConfig): Route[] {
  void config;
  throw new Error('not implemented');
}
