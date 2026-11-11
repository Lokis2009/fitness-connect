import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { UnconfiguredAuthService } from './unconfigured-auth-service';

describe('UnconfiguredAuthService', () => {
  let auth: UnconfiguredAuthService;

  beforeEach(() => {
    auth = TestBed.inject(UnconfiguredAuthService);
  });

  it('implements the AuthService contract', () => {
    expect(auth).toBeInstanceOf(AuthService);
  });

  it('never has a session', () => {
    expect(auth.user()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.accessToken()).toBeNull();
  });

  it('fails loudly when a sign-in is started, because production auth is not built yet', () => {
    expect(() => auth.signIn('/trainers')).toThrow(/Cognito/);
  });

  it('signs out and restores nothing without error', async () => {
    expect(() => auth.signOut()).not.toThrow();
    await expect(auth.restoreSession()).resolves.toBeUndefined();
  });
});
