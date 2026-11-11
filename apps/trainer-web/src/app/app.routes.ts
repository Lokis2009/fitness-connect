import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@fitness-connect/auth';
import { loginRoutes } from '@fitness-connect/feature-login';

export const appRoutes: Route[] = [
  ...loginRoutes({
    title: 'Trainer sign in',
    description: 'Manage your clients, schedule and earnings.',
    expectedRole: 'trainer',
    homePath: '/',
  }),
  {
    path: '',
    canActivate: [authGuard, roleGuard('trainer')],
    loadComponent: () =>
      import('@fitness-connect/feature-home').then((m) => m.SignedInHome),
  },
  { path: '**', redirectTo: '' },
];
