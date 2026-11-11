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
    id: '5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40',
    email: `${role}@example.com`,
    displayName: `Test ${role}`,
    role,
  };
}

describe('appRoutes', () => {
  const user = signal<User | null>(null);

  async function harness() {
    return RouterTestingHarness.create();
  }

  function text(h: RouterTestingHarness): string {
    return (h.routeNativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(() => {
    user.set(null);
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
          },
        },
        {
          provide: ApiClient,
          useValue: { getMe: () => of(userWithRole('trainer')) },
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

  it.each<Role>(['client', 'admin'])(
    'redirects a %s to /login',
    async (role) => {
      user.set(userWithRole(role));
      const h = await harness();

      await h.navigateByUrl('/');

      expect(TestBed.inject(Router).url).toContain('/login');
    },
  );

  it('shows the home page to a trainer', async () => {
    user.set(userWithRole('trainer'));
    const h = await harness();

    await h.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(h.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Test trainer',
    );
  });

  it('redirects unknown paths to the home page', async () => {
    user.set(userWithRole('trainer'));
    const h = await harness();

    await h.navigateByUrl('/does/not/exist');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(text(h)).toContain('Sign out');
  });

  it('renders the landing page on /login with the trainer config', async () => {
    const h = await harness();

    await h.navigateByUrl('/login');

    const root = h.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain(
      'Trainer sign in',
    );
    expect(root.textContent).toContain(
      'Manage your clients, schedule and earnings.',
    );
    expect(root.querySelector('fc-button')?.textContent).toContain('Sign in');
  });

  it('signs out from the home page and lands on /login', async () => {
    user.set(userWithRole('trainer'));
    const h = await harness();
    await h.navigateByUrl('/');

    (h.routeNativeElement as HTMLElement).querySelector('button')?.click();
    await h.fixture.whenStable();
    h.detectChanges();

    expect(user()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(text(h)).toContain('Trainer sign in');
  });
});
