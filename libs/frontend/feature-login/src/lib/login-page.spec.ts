import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@fitness-connect/auth';
import type { Role, User } from '@fitness-connect/data-access';
import { LOGIN_CONFIG_DATA_KEY, type LoginConfig } from './login-config';
import { LoginPage } from './login-page';

@Component({ template: 'home' })
class HomeStub {}

const config: LoginConfig = {
  title: 'Trainer sign in',
  description: 'Manage your clients and sessions.',
  expectedRole: 'trainer',
  homePath: '/home',
};

function userWithRole(role: Role): User {
  return { id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10', email: `${role}@example.com`, displayName: role, role };
}

describe('LoginPage', () => {
  const currentUser = signal<User | null>(null);
  const signIn = vi.fn<(returnUrl?: string) => void>();

  async function setup(url = '/login', loginConfig: LoginConfig = config) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginPage, data: { [LOGIN_CONFIG_DATA_KEY]: loginConfig } },
          { path: 'home', component: HomeStub },
          { path: 'ok', component: HomeStub },
        ]),
        {
          provide: AuthService,
          useValue: { user: currentUser, isAuthenticated: computed(() => currentUser() !== null), signIn },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const root = harness.routeNativeElement as HTMLElement;
    return { harness, root, router: TestBed.inject(Router) };
  }

  beforeEach(() => {
    currentUser.set(null);
    signIn.mockReset();
  });

  it('shows the configured title and description', async () => {
    const { root } = await setup();

    expect(root.querySelector('h1')?.textContent).toContain('Trainer sign in');
    expect(root.textContent).toContain('Manage your clients and sessions.');
  });

  it('omits the description when none is configured', async () => {
    const { root } = await setup('/login', { ...config, description: undefined });

    expect(root.querySelector('fc-text')).toBeNull();
  });

  it('has a "Sign in" button', async () => {
    const { root } = await setup();

    const button = root.querySelector('fc-button button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Sign in');
  });

  it('starts sign-in with the home path when there is no returnUrl', async () => {
    const { root } = await setup();

    (root.querySelector('fc-button button') as HTMLButtonElement).click();

    expect(signIn).toHaveBeenCalledExactlyOnceWith('/home');
  });

  it('starts sign-in with a safe returnUrl', async () => {
    const { root } = await setup('/login?returnUrl=%2Fok');

    (root.querySelector('fc-button button') as HTMLButtonElement).click();

    expect(signIn).toHaveBeenCalledExactlyOnceWith('/ok');
  });

  it.each(['//evil.com', 'https://evil.com'])('ignores the unsafe returnUrl %s', async (unsafe) => {
    const { root } = await setup(`/login?returnUrl=${encodeURIComponent(unsafe)}`);

    (root.querySelector('fc-button button') as HTMLButtonElement).click();

    expect(signIn).toHaveBeenCalledExactlyOnceWith('/home');
  });

  it('redirects to the home path when already signed in with the expected role', async () => {
    currentUser.set(userWithRole('trainer'));

    const { router } = await setup();

    expect(router.url).toBe('/home');
  });

  it('redirects to a safe returnUrl when already signed in with the expected role', async () => {
    currentUser.set(userWithRole('trainer'));

    const { router } = await setup('/login?returnUrl=%2Fok');

    expect(router.url).toBe('/ok');
  });

  it('does not redirect to an unsafe returnUrl when already signed in', async () => {
    currentUser.set(userWithRole('trainer'));

    const { router } = await setup(`/login?returnUrl=${encodeURIComponent('//evil.com')}`);

    expect(router.url).toBe('/home');
  });

  it('replaces the login page in the history when redirecting', async () => {
    currentUser.set(userWithRole('trainer'));

    const { harness } = await setup();

    expect((harness.routeNativeElement as HTMLElement).textContent).toBe('home');
    expect(TestBed.inject(Router).lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
  });

  it('keeps showing the page when signed in with another role', async () => {
    currentUser.set(userWithRole('client'));

    const { root, router } = await setup();

    expect(router.url).toBe('/login');
    expect(root.querySelector('h1')?.textContent).toContain('Trainer sign in');
  });

  it('redirects when the user signs in while the page is open', async () => {
    const { harness, router } = await setup();
    expect(router.url).toBe('/login');

    currentUser.set(userWithRole('trainer'));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/home');
  });
});
