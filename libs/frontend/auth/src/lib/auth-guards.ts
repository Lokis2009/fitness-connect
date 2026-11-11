import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import type { Role } from '@fitness-connect/data-access';
import { AuthService } from './auth-service';

/** Allows signed-in users; others are redirected to `/login?returnUrl=<requested url>`. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return (
    auth.isAuthenticated() ||
    router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};

/**
 * Allows users with the given role; everyone else (signed out or another role)
 * is redirected to `/login?returnUrl=<requested url>`.
 */
export function roleGuard(role: Role): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return (
      auth.user()?.role === role ||
      router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    );
  };
}
