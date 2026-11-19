import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@fitness-connect/auth';
import { loginRoutes } from '@fitness-connect/feature-login';
import {
  trainerApprovedGuard,
  trainerSetupGuard,
} from '@fitness-connect/trainer-access';

export const appRoutes: Route[] = [
  ...loginRoutes({
    title: 'Trainer sign in',
    description: 'Answer booking requests and see your schedule',
    expectedRole: 'trainer',
    homePath: '/',
  }),
  {
    path: 'setup',
    canActivate: [authGuard, roleGuard('trainer'), trainerSetupGuard],
    loadComponent: () =>
      import('@fitness-connect/feature-trainer-setup').then(
        (m) => m.TrainerSetup,
      ),
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard('trainer')],
    canActivateChild: [trainerApprovedGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@fitness-connect/feature-trainer-home').then(
            (m) => m.TrainerHome,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
