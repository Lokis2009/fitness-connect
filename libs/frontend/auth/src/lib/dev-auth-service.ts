import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClient, ApiError, type Role, type User } from '@fitness-connect/data-access';
import { firstValueFrom } from 'rxjs';
import { InvalidCredentialsError, WrongRoleError } from './auth-errors';
import { AuthService } from './auth-service';
import { TokenStorage } from './token-storage';

/**
 * Development-only `AuthService`. Signs in through `POST /v1/dev/login`
 * (seeded users). Never include it in production builds: wire it with
 * `provideDevAuth()` only in non-production configurations.
 */
@Service()
export class DevAuthService extends AuthService {
  readonly #api = inject(ApiClient);
  readonly #storage = inject(TokenStorage);
  readonly #router = inject(Router);
  readonly #user = signal<User | null>(null);

  readonly user = this.#user.asReadonly();
  readonly isAuthenticated = computed(() => this.#user() !== null);

  accessToken(): string | null {
    return this.#storage.get();
  }

  /** Navigates to `/dev-login`, keeping `returnUrl` as a query parameter. */
  signIn(returnUrl?: string): void {
    void this.#router.navigate(['/dev-login'], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  }

  signOut(): void {
    this.#storage.clear();
    this.#user.set(null);
  }

  /** Reads the stored token and loads the user with `GET /v1/me`; clears the token on failure. */
  async restoreSession(): Promise<void> {
    if (this.#storage.get() === null) return;

    try {
      this.#user.set(await firstValueFrom(this.#api.getMe()));
    } catch {
      this.signOut();
    }
  }

  /**
   * Signs in with a seeded dev account and resolves with the user.
   *
   * @throws InvalidCredentialsError on HTTP 401
   * @throws WrongRoleError (after signing out) when `expectedRole` is given and differs
   * @throws ApiError for any other API failure
   */
  async login(email: string, password: string, expectedRole?: Role): Promise<User> {
    let response;
    try {
      response = await firstValueFrom(this.#api.devLogin({ email, password }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new InvalidCredentialsError({ cause: error });
      }
      throw error;
    }

    const { accessToken, user } = response;
    if (expectedRole !== undefined && user.role !== expectedRole) {
      this.signOut();
      throw new WrongRoleError(expectedRole, user.role);
    }

    this.#storage.set(accessToken);
    this.#user.set(user);
    return user;
  }
}
