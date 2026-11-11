import { Service, computed, signal } from '@angular/core';
import type { Role, User } from '@fitness-connect/data-access';
import { AuthService } from './auth-service';

/**
 * Development-only `AuthService`. Signs in through `POST /v1/dev/login`
 * (seeded users). Never include it in production builds: wire it with
 * `provideDevAuth()` only in non-production configurations.
 */
@Service()
export class DevAuthService extends AuthService {
  protected readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  accessToken(): string | null {
    throw new Error('not implemented');
  }

  /** Navigates to `/dev-login`, keeping `returnUrl` as a query parameter. */
  signIn(returnUrl?: string): void {
    throw new Error('not implemented');
  }

  signOut(): void {
    throw new Error('not implemented');
  }

  /** Reads the stored token and loads the user with `GET /v1/me`; clears the token on failure. */
  restoreSession(): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * Signs in with a seeded dev account and resolves with the user.
   *
   * @throws InvalidCredentialsError on HTTP 401
   * @throws WrongRoleError (after signing out) when `expectedRole` is given and differs
   * @throws ApiError for any other API failure
   */
  login(email: string, password: string, expectedRole?: Role): Promise<User> {
    throw new Error('not implemented');
  }
}
