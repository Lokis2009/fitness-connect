import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, type Role, type User } from '@fitness-connect/auth';
import { ApiClient } from '@fitness-connect/data-access';
import { of } from 'rxjs';
import { appRoutes } from './app.routes';

function userWithRole(role: Role): User {
  return {
    id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
    email: `${role}@example.com`,
    displayName: `Test ${role}`,
    role,
  };
}

describe('appRoutes', () => {
  const user = signal<User | null>(null);
  const signOut = vi.fn(() => user.set(null));

  async function setup(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        {
          provide: AuthService,
          useValue: {
            user,
            isAuthenticated: computed(() => user() !== null),
            signIn: vi.fn(),
            signOut,
          },
        },
        {
          provide: ApiClient,
          useValue: { getMe: () => of(userWithRole('admin')) },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { harness, router: TestBed.inject(Router) };
  }

  beforeEach(() => {
    user.set(null);
    signOut.mockClear();
  });

  it('redirects an unauthenticated user to /login with the return url', async () => {
    const { router } = await setup('/');

    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('redirects a user with another role to /login', async () => {
    user.set(userWithRole('client'));

    const { router } = await setup('/');

    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('shows the home page to an admin', async () => {
    user.set(userWithRole('admin'));

    const { harness, router } = await setup('/');

    expect(router.url).toBe('/');
    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Test admin');
  });

  it('renders the sign in landing page at /login', async () => {
    const { harness } = await setup('/login');

    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Admin sign in');
    expect(root.textContent).toContain('Sign in');
  });

  it('sends an admin who lands on /login on to the home page', async () => {
    user.set(userWithRole('admin'));

    const { router } = await setup('/login');

    expect(router.url).toBe('/');
  });

  it('redirects unknown paths to the home page', async () => {
    user.set(userWithRole('admin'));

    const { router } = await setup('/does-not-exist');

    expect(router.url).toBe('/');
  });

  it('sends an unauthenticated user from an unknown path to /login', async () => {
    const { router } = await setup('/does-not-exist');

    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('signs out from the home page and lands on /login', async () => {
    user.set(userWithRole('admin'));
    const { harness, router } = await setup('/');
    const root = harness.routeNativeElement as HTMLElement;
    const button = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign out'),
    );

    button?.click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/login');
  });
});
