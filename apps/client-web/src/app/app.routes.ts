import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@fitness-connect/auth';
import { loginRoutes } from '@fitness-connect/feature-login';

export const appRoutes: Route[] = [
  ...loginRoutes({
    title: 'Sign in to Fitness Connect',
    description: 'Find trainers and book your sessions.',
    expectedRole: 'client',
    homePath: '/',
  }),
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard, roleGuard('client')],
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
