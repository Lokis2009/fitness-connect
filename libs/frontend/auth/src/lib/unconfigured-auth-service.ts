import { Service, computed } from '@angular/core';
import { AuthService } from './auth-service';

/**
 * `AuthService` of production builds until the Cognito implementation exists (D7). It never has a
 * session, so guards send every visitor to `/login`, and starting a sign-in fails loudly.
 */
@Service()
export class UnconfiguredAuthService extends AuthService {
  readonly user = computed(() => {
    throw new Error('not implemented');
  });
  readonly isAuthenticated = computed(() => {
    throw new Error('not implemented');
  });

  accessToken(): string | null {
    throw new Error('not implemented');
  }

  signIn(): void {
    throw new Error('not implemented');
  }

  signOut(): void {
    throw new Error('not implemented');
  }

  restoreSession(): Promise<void> {
    throw new Error('not implemented');
  }
}
