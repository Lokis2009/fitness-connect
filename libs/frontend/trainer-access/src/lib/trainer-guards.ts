import { inject } from '@angular/core';
import {
  type CanActivateChildFn,
  type CanActivateFn,
  Router,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { trainerStatusOf } from './trainer-status';

function loginRedirect(router: Router, state: RouterStateSnapshot): UrlTree {
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
}

/**
 * Child guard for the approved-only routes. Allows a trainer whose status is `approved`; any other
 * signed-in trainer (including a `null` status) is redirected to `/setup`. A signed-out user or a
 * non-trainer goes to `/login?returnUrl=<requested url>`.
 */
export const trainerApprovedGuard: CanActivateChildFn = (_route, state) => {
  const user = inject(AuthService).user();
  const router = inject(Router);

  if (user?.role !== 'trainer') {
    return loginRedirect(router, state);
  }
  return trainerStatusOf(user) === 'approved' || router.createUrlTree(['/setup']);
};

/**
 * Guard of `/setup`. Allows a trainer who is not approved; an approved trainer is redirected to
 * `/`. A signed-out user or a non-trainer goes to `/login?returnUrl=<requested url>`.
 */
export const trainerSetupGuard: CanActivateFn = (_route, state) => {
  const user = inject(AuthService).user();
  const router = inject(Router);

  if (user?.role !== 'trainer') {
    return loginRedirect(router, state);
  }
  return trainerStatusOf(user) !== 'approved' || router.createUrlTree(['/']);
};
