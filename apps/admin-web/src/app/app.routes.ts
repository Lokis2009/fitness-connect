import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@fitness-connect/auth';
import { loginRoutes } from '@fitness-connect/feature-login';

export const appRoutes: Route[] = [
  ...loginRoutes({
    title: 'Admin sign in',
    description: 'Review trainers, moderate content and keep the platform safe.',
    expectedRole: 'admin',
    homePath: '/',
  }),
  {
    path: '',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
