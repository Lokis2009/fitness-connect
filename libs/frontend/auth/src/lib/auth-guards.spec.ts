import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  Router,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import type { Role, User } from '@fitness-connect/data-access';
import { authGuard, roleGuard } from './auth-guards';
import { AuthService } from './auth-service';

function userWithRole(role: Role): User {
  return {
    id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
    email: `${role}@example.com`,
    displayName: role,
    role,
  };
}

describe('guards', () => {
  const currentUser = signal<User | null>(null);
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/trainers?page=2' } as RouterStateSnapshot;

  beforeEach(() => {
    currentUser.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: currentUser, isAuthenticated: computed(() => currentUser() !== null) },
        },
      ],
    });
  });

  function run(guard: CanActivateFn) {
    return TestBed.runInInjectionContext(() => guard(route, state));
  }

  function loginUrl(result: unknown): string {
    expect(result).toBeInstanceOf(UrlTree);
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  describe('authGuard', () => {
    it('allows a signed-in user', () => {
      currentUser.set(userWithRole('client'));
      expect(run(authGuard)).toBe(true);
    });

    it('redirects an unauthenticated user to /login with the return URL', () => {
      expect(loginUrl(run(authGuard))).toBe('/login?returnUrl=%2Ftrainers%3Fpage%3D2');
    });
  });

  describe('roleGuard', () => {
    it('allows a user with the required role', () => {
      currentUser.set(userWithRole('trainer'));
      expect(run(roleGuard('trainer'))).toBe(true);
    });

    it('redirects a user with a different role to /login', () => {
      currentUser.set(userWithRole('client'));
      expect(loginUrl(run(roleGuard('trainer')))).toBe('/login?returnUrl=%2Ftrainers%3Fpage%3D2');
    });

    it('redirects an unauthenticated user to /login', () => {
      expect(loginUrl(run(roleGuard('admin')))).toBe('/login?returnUrl=%2Ftrainers%3Fpage%3D2');
    });
  });
});
