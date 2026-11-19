import type { Router } from '@angular/router';
import type { AuthService } from '@fitness-connect/auth';
import type { ApiError } from '@fitness-connect/data-access';

/** `true` for the 403 the API sends to a trainer who is not approved. */
export function isNotApproved(error: ApiError): boolean {
  return error.status === 403 && error.code === 'trainer-not-approved';
}

/**
 * Handles a 403 `trainer-not-approved`: reloads the user and, when the status is no longer
 * `approved`, moves the trainer to `/setup`. Resolves with `true` when it navigated. A status that
 * is still `approved` (the 403 was unexpected) or a failed reload resolves with `false`, and the
 * caller shows its error.
 */
export async function leaveWhenNotApproved(auth: AuthService, router: Router): Promise<boolean> {
  try {
    await auth.refreshUser();
  } catch {
    return false;
  }
  if (auth.user()?.trainerStatus === 'approved') {
    return false;
  }
  await router.navigate(['/setup']);
  return true;
}
