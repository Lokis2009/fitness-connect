import { Service, signal } from '@angular/core';
import { AuthService } from './auth-service';

/**
 * `AuthService` of production builds until the Cognito implementation exists (D7). It never has a
 * session, so guards send every visitor to `/login`, and starting a sign-in fails loudly.
 */
@Service()
export class UnconfiguredAuthService extends AuthService {
  readonly user = signal(null).asReadonly();
  readonly isAuthenticated = signal(false).asReadonly();

  accessToken(): string | null {
    return null;
  }

  signIn(): void {
    throw new Error('Production sign-in is not implemented yet (Cognito, D7)');
  }

  signOut(): void {
    // Nothing to clear: there is never a session.
  }

  async restoreSession(): Promise<void> {
    // Nothing to restore.
  }
}
