import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateChildFn,
  type CanActivateFn,
  Router,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import type { Role, TrainerStatus, User } from '@fitness-connect/data-access';
import { trainerApprovedGuard, trainerSetupGuard } from './trainer-guards';

function userWith(role: Role, extra: Partial<User> = {}): User {
  return {
    id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
    email: `${role}@example.com`,
    displayName: role,
    role,
    ...extra,
  };
}

const UNAPPROVED: TrainerStatus[] = ['incomplete', 'submitted', 'changes_requested'];

describe('trainer guards', () => {
  const currentUser = signal<User | null>(null);
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/?request=abc' } as RouterStateSnapshot;
  const loginUrl = '/login?returnUrl=%2F%3Frequest%3Dabc';

  beforeEach(() => {
    currentUser.set(null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { user: currentUser } }],
    });
  });

  function run(guard: CanActivateFn | CanActivateChildFn) {
    return TestBed.runInInjectionContext(() => guard(route, state));
  }

  function urlOf(result: unknown): string {
    expect(result).toBeInstanceOf(UrlTree);
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  describe.each([
    ['trainerApprovedGuard', trainerApprovedGuard],
    ['trainerSetupGuard', trainerSetupGuard],
  ])('%s', (_name, guard) => {
    it('redirects a signed-out user to /login keeping the query string', () => {
      expect(urlOf(run(guard))).toBe(loginUrl);
    });

    it.each<Role>(['client', 'admin'])('redirects a %s to /login', (role) => {
      currentUser.set(userWith(role));
      expect(urlOf(run(guard))).toBe(loginUrl);
    });
  });

  describe('trainerApprovedGuard', () => {
    it('allows an approved trainer', () => {
      currentUser.set(userWith('trainer', { trainerStatus: 'approved' }));
      expect(run(trainerApprovedGuard)).toBe(true);
    });

    it.each(UNAPPROVED)('redirects a trainer with status %s to /setup', (status) => {
      currentUser.set(userWith('trainer', { trainerStatus: status }));
      expect(urlOf(run(trainerApprovedGuard))).toBe('/setup');
    });

    it('redirects a trainer whose status is null to /setup', () => {
      currentUser.set(userWith('trainer', { trainerStatus: null }));
      expect(urlOf(run(trainerApprovedGuard))).toBe('/setup');
    });

    it('redirects a trainer with no status field to /setup', () => {
      currentUser.set(userWith('trainer'));
      expect(urlOf(run(trainerApprovedGuard))).toBe('/setup');
    });
  });

  describe('trainerSetupGuard', () => {
    it('redirects an approved trainer to /', () => {
      currentUser.set(userWith('trainer', { trainerStatus: 'approved' }));
      expect(urlOf(run(trainerSetupGuard))).toBe('/');
    });

    it.each(UNAPPROVED)('allows a trainer with status %s', (status) => {
      currentUser.set(userWith('trainer', { trainerStatus: status }));
      expect(run(trainerSetupGuard)).toBe(true);
    });

    it('allows a trainer whose status is null', () => {
      currentUser.set(userWith('trainer', { trainerStatus: null }));
      expect(run(trainerSetupGuard)).toBe(true);
    });

    it('allows a trainer with no status field', () => {
      currentUser.set(userWith('trainer'));
      expect(run(trainerSetupGuard)).toBe(true);
    });
  });

  describe('decision table', () => {
    const statuses: (TrainerStatus | null | undefined)[] = [
      'approved',
      ...UNAPPROVED,
      null,
      undefined,
    ];

    it.each(statuses)('lets exactly one of the two guards through for status %s', (status) => {
      currentUser.set(userWith('trainer', status === undefined ? {} : { trainerStatus: status }));
      const approved = run(trainerApprovedGuard) === true;
      const setup = run(trainerSetupGuard) === true;
      expect(approved).not.toBe(setup);
    });
  });
});
