import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, type Role, type User } from '@fitness-connect/auth';
import { ApiClient, type TrainerStatus } from '@fitness-connect/data-access';
import { of } from 'rxjs';
import { appRoutes } from './app.routes';

function userWithRole(
  role: Role,
  trainerStatus: TrainerStatus | null = 'approved',
): User {
  return {
    id: '5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40',
    email: `${role}@example.com`,
    displayName: `Test ${role}`,
    role,
    ...(role === 'trainer'
      ? {
          trainerStatus,
          trainerStatusNote: null,
          trainerVenueTimeZone: 'Europe/Warsaw',
        }
      : {}),
  };
}

describe('appRoutes', () => {
  const user = signal<User | null>(null);
  const refreshUser = vi.fn<() => Promise<void>>();

  async function harness() {
    return RouterTestingHarness.create();
  }

  function text(h: RouterTestingHarness): string {
    return (h.routeNativeElement as HTMLElement).textContent ?? '';
  }

  function heading(h: RouterTestingHarness): string {
    return h.routeNativeElement?.querySelector('h1')?.textContent ?? '';
  }

  beforeEach(() => {
    user.set(null);
    refreshUser.mockReset();
    refreshUser.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        {
          provide: AuthService,
          useValue: {
            user,
            isAuthenticated: computed(() => user() !== null),
            signIn: vi.fn(),
            signOut: () => user.set(null),
            refreshUser,
          },
        },
        {
          provide: ApiClient,
          useValue: {
            getMe: () => of(userWithRole('trainer')),
            getBookingRequests: () =>
              of({ serverTime: new Date().toISOString(), items: [] }),
            getSessions: () =>
              of({ serverTime: new Date().toISOString(), items: [] }),
            acceptBooking: vi.fn(),
            declineBooking: vi.fn(),
          },
        },
      ],
    });
  });

  it('redirects unauthenticated users to /login with the return url', async () => {
    const h = await harness();

    await h.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2F');
    expect(text(h)).toContain('Trainer sign in');
  });

  it('redirects an unauthenticated user from /setup to /login with the return url', async () => {
    const h = await harness();

    await h.navigateByUrl('/setup');

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fsetup');
  });

  it.each<Role>(['client', 'admin'])(
    'redirects a %s to /login',
    async (role) => {
      user.set(userWithRole(role));
      const h = await harness();

      await h.navigateByUrl('/');

      expect(TestBed.inject(Router).url).toContain('/login');
    },
  );

  it.each<Role>(['client', 'admin'])(
    'redirects a %s from /setup to /login',
    async (role) => {
      user.set(userWithRole(role));
      const h = await harness();

      await h.navigateByUrl('/setup');

      expect(TestBed.inject(Router).url).toContain('/login');
    },
  );

  it('shows the trainer home to an approved trainer', async () => {
    user.set(userWithRole('trainer', 'approved'));
    const h = await harness();

    await h.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(heading(h)).toContain('Trainer home');
  });

  it('redirects an approved trainer from /setup to /', async () => {
    user.set(userWithRole('trainer', 'approved'));
    const h = await harness();

    await h.navigateByUrl('/setup');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(heading(h)).toContain('Trainer home');
  });

  it.each<TrainerStatus | null>([
    'incomplete',
    'submitted',
    'changes_requested',
    null,
  ])('redirects a trainer with status %s from / to /setup', async (status) => {
    user.set(userWithRole('trainer', status));
    const h = await harness();

    await h.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/setup');
    expect(heading(h)).not.toContain('Trainer home');
  });

  it('shows /setup to a trainer who is not approved', async () => {
    user.set(userWithRole('trainer', 'submitted'));
    const h = await harness();

    await h.navigateByUrl('/setup');

    expect(TestBed.inject(Router).url).toBe('/setup');
    expect(text(h)).toContain('Your profile is under review');
  });

  it('redirects unknown paths to the home page', async () => {
    user.set(userWithRole('trainer'));
    const h = await harness();

    await h.navigateByUrl('/does/not/exist');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(heading(h)).toContain('Trainer home');
    expect(text(h)).toContain('Sign out');
  });

  it('sends unknown paths of an unapproved trainer on to /setup', async () => {
    user.set(userWithRole('trainer', 'incomplete'));
    const h = await harness();

    await h.navigateByUrl('/does/not/exist');

    expect(TestBed.inject(Router).url).toBe('/setup');
  });

  it('keeps ?request=<id> in the return url when signed out', async () => {
    const h = await harness();

    await h.navigateByUrl('/?request=abc-123');

    expect(TestBed.inject(Router).url).toBe(
      '/login?returnUrl=%2F%3Frequest%3Dabc-123',
    );
  });

  it('renders the landing page on /login with the trainer config', async () => {
    const h = await harness();

    await h.navigateByUrl('/login');

    const root = h.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Trainer sign in');
    expect(root.textContent).toContain(
      'Answer booking requests and see your schedule',
    );
    expect(root.querySelector('fc-button')?.textContent).toContain('Sign in');
  });

  it('signs out from the home page and lands on /login', async () => {
    user.set(userWithRole('trainer'));
    const h = await harness();
    await h.navigateByUrl('/');

    const signOut = Array.from(
      (h.routeNativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Sign out'));
    signOut?.click();
    await h.fixture.whenStable();
    h.detectChanges();

    expect(user()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(text(h)).toContain('Trainer sign in');
  });
});
