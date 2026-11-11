// Temporary: proves the skeleton stubs fail loudly. Replaced by the real specs in the next commit.
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import type { HttpRequest } from '@angular/common/http';
import { authGuard, roleGuard } from './auth-guards';
import { authInterceptor } from './auth-interceptor';
import { DevAuthService } from './dev-auth-service';
import { InvalidCredentialsError, WrongRoleError } from './auth-errors';
import { provideDevAuth } from './provide-dev-auth';
import { TokenStorage } from './token-storage';

describe('auth skeleton', () => {
  it('DevAuthService methods are not implemented', () => {
    const auth = TestBed.inject(DevAuthService);
    expect(auth.user()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(() => auth.accessToken()).toThrow('not implemented');
    expect(() => auth.signIn()).toThrow('not implemented');
    expect(() => auth.signOut()).toThrow('not implemented');
    expect(() => auth.restoreSession()).toThrow('not implemented');
    expect(() => auth.login('a@b.c', 'x')).toThrow('not implemented');
  });

  it('TokenStorage methods are not implemented', () => {
    const storage = TestBed.inject(TokenStorage);
    expect(() => storage.get()).toThrow('not implemented');
    expect(() => storage.set('t')).toThrow('not implemented');
    expect(() => storage.clear()).toThrow('not implemented');
  });

  it('guards and interceptor are not implemented', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    expect(() => authGuard(route, state)).toThrow('not implemented');
    expect(() => roleGuard('trainer')(route, state)).toThrow('not implemented');
    expect(() => authInterceptor({} as HttpRequest<unknown>, () => {
      throw new Error('unreachable');
    })).toThrow('not implemented');
  });

  it('errors and providers exist', () => {
    expect(new InvalidCredentialsError()).toBeInstanceOf(Error);
    expect(new WrongRoleError('trainer', 'client').expected).toBe('trainer');
    expect(provideDevAuth()).toBeDefined();  });
});
