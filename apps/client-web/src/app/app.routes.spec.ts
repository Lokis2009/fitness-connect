import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, type Role, type User } from '@fitness-connect/data-access';
import { NEVER } from 'rxjs';
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

  async function open(url: string) {
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
        { provide: ApiClient, useValue: { getMe: () => NEVER } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return {
      harness,
      root: harness.routeNativeElement as HTMLElement,
      router: TestBed.inject(Router),
    };
  }

  beforeEach(() => {
    user.set(null);
    signOut.mockClear();
  });

  it('redirects a visitor who is not signed in to the login page with a return url', async () => {
    const { router } = await open('/');

    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('renders the login landing page', async () => {
    const { root } = await open('/login');

    expect(root.querySelector('h1')?.textContent).toContain(
      'Sign in to Fitness Connect',
    );
    expect(root.textContent).toContain('Find trainers and book your sessions.');
    expect(root.querySelector('fc-button')?.textContent).toContain('Sign in');
  });

  it('offers the dev login page in development', async () => {
    const { router } = await open('/dev-login');

    expect(router.url).toBe('/dev-login');
  });

  it.each<Role>(['trainer', 'admin'])(
    'redirects a signed-in %s to the login page',
    async (role) => {
      user.set(userWithRole(role));
      const { router } = await open('/');

      expect(router.url).toContain('/login');
    },
  );

  it('shows the home page to a signed-in client', async () => {
    user.set(userWithRole('client'));
    const { router, root } = await open('/');

    expect(router.url).toBe('/');
    expect(root.querySelector('h1')?.textContent).toContain('Test client');
  });

  it('sends unknown urls to the home page', async () => {
    user.set(userWithRole('client'));
    const { router, root } = await open('/does/not/exist');

    expect(router.url).toBe('/');
    expect(root.querySelector('h1')?.textContent).toContain('Test client');
  });

  it('signs out from the home page and lands on the login page', async () => {
    user.set(userWithRole('client'));
    const { harness, router } = await open('/');

    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('fc-button button')
      ?.click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.url).toContain('/login');
  });
});
