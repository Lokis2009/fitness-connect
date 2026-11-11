import { Component, computed, isDevMode, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Route, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, DevAuthService } from '@fitness-connect/auth';
import { DevLoginPage } from './dev-login-page';
import { LOGIN_CONFIG_DATA_KEY, type LoginConfig, injectLoginConfig } from './login-config';
import { LoginPage } from './login-page';
import { loginRoutes } from './login-routes';

vi.mock('@angular/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@angular/core')>()),
  isDevMode: vi.fn(() => true),
}));

const config: LoginConfig = {
  title: 'Admin sign in',
  description: 'Restricted area.',
  expectedRole: 'admin',
  homePath: '/dashboard',
};

async function load(route: Route | undefined) {
  return (route?.loadComponent as () => Promise<unknown>)();
}

describe('loginRoutes', () => {
  beforeEach(() => {
    vi.mocked(isDevMode).mockReturnValue(true);
  });

  describe('in development mode', () => {
    it('returns the login and dev-login routes, in that order', () => {
      expect(loginRoutes(config).map((r) => r.path)).toEqual(['login', 'dev-login']);
    });

    it('carries the config in the data of both routes', () => {
      for (const route of loginRoutes(config)) {
        expect(route.data?.[LOGIN_CONFIG_DATA_KEY]).toBe(config);
      }
    });

    it('lazy-loads LoginPage and DevLoginPage', async () => {
      const [login, devLogin] = loginRoutes(config);

      expect(await load(login)).toBe(LoginPage);
      expect(await load(devLogin)).toBe(DevLoginPage);
    });
  });

  describe('outside development mode', () => {
    beforeEach(() => {
      vi.mocked(isDevMode).mockReturnValue(false);
    });

    it('only returns the login route', () => {
      expect(loginRoutes(config).map((r) => r.path)).toEqual(['login']);
    });

    it('still carries the config and lazy-loads LoginPage', async () => {
      const [login] = loginRoutes(config);

      expect(login.data?.[LOGIN_CONFIG_DATA_KEY]).toBe(config);
      expect(await load(login)).toBe(LoginPage);
    });
  });

  describe('when used in a router', () => {
    it('renders the landing page with the config from the route', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter(loginRoutes(config)),
          { provide: AuthService, useValue: { user: signal(null), isAuthenticated: computed(() => false), signIn: vi.fn() } },
        ],
      });
      const harness = await RouterTestingHarness.create();

      const page = await harness.navigateByUrl('/login', LoginPage);

      expect(page).toBeInstanceOf(LoginPage);
      expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Admin sign in');
    });

    it('renders the dev login page in development mode', async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter(loginRoutes(config)), { provide: DevAuthService, useValue: { login: vi.fn() } }],
      });
      const harness = await RouterTestingHarness.create();

      const page = await harness.navigateByUrl('/dev-login', DevLoginPage);

      expect(page).toBeInstanceOf(DevLoginPage);
    });

    it('has no dev-login route outside development mode', async () => {
      vi.mocked(isDevMode).mockReturnValue(false);
      TestBed.configureTestingModule({ providers: [provideRouter(loginRoutes(config))] });
      const harness = await RouterTestingHarness.create();

      await expect(harness.navigateByUrl('/dev-login')).rejects.toThrow(/Cannot match any routes/);
    });
  });
});

describe('injectLoginConfig', () => {
  @Component({ template: '' })
  class Probe {
    readonly config = injectLoginConfig();
  }

  it('returns the config of the current route', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'p', component: Probe, data: { [LOGIN_CONFIG_DATA_KEY]: config } }])],
    });

    const probe = await (await RouterTestingHarness.create()).navigateByUrl('/p', Probe);

    expect(probe.config).toBe(config);
  });

  it('explains the problem when the route has no config', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'p', component: Probe }])] });
    const harness = await RouterTestingHarness.create();

    await expect(harness.navigateByUrl('/p', Probe)).rejects.toThrow(/loginRoutes/);
  });
});
