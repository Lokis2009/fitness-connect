import type { CanActivateChildFn, CanActivateFn } from '@angular/router';

/**
 * Child guard for the approved-only routes. Allows a trainer whose status is `approved`; any other
 * signed-in trainer (including a `null` status) is redirected to `/setup`.
 */
export const trainerApprovedGuard: CanActivateChildFn = () => {
  throw new Error('not implemented');
};

/**
 * Guard of `/setup`. Allows a trainer who is not approved; an approved trainer is redirected to
 * `/`.
 */
export const trainerSetupGuard: CanActivateFn = () => {
  throw new Error('not implemented');
};
