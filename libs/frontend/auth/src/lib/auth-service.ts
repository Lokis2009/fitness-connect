import type { Signal } from '@angular/core';
import type { User } from '@fitness-connect/data-access';

/**
 * Authentication contract shared by the client, trainer and admin apps.
 *
 * The abstract class is the DI token: inject `AuthService`, never a concrete
 * implementation (except in the dev login page, which needs `DevAuthService`).
 * The interface deliberately does not assume a password form, because the
 * production implementation redirects to the Cognito hosted login page.
 */
export abstract class AuthService {
  /** The signed-in user, or `null` when signed out. */
  abstract readonly user: Signal<User | null>;

  /** `true` while a user is signed in. */
  abstract readonly isAuthenticated: Signal<boolean>;

  /** The current access token, or `null` when signed out. */
  abstract accessToken(): string | null;

  /**
   * Starts sign-in. Production redirects to the hosted login page; the dev
   * implementation navigates to `/dev-login`. `returnUrl` is where the user
   * should land once signed in.
   */
  abstract signIn(returnUrl?: string): void;

  /** Clears the session. Does not navigate. */
  abstract signOut(): void;

  /**
   * Restores a previous session (for example after a page reload). Resolves
   * when done and never rejects: a missing or invalid session just leaves the
   * user signed out.
   */
  abstract restoreSession(): Promise<void>;
}
