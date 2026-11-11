import type { CanActivateFn } from '@angular/router';
import type { Role } from '@fitness-connect/data-access';

/** Allows signed-in users; others are redirected to `/login?returnUrl=<requested url>`. */
export const authGuard: CanActivateFn = () => {
  throw new Error('not implemented');
};

/**
 * Allows users with the given role; everyone else (signed out or another role)
 * is redirected to `/login?returnUrl=<requested url>`.
 */
export function roleGuard(role: Role): CanActivateFn {
  return () => {
    throw new Error(`not implemented (${role})`);
  };
}
