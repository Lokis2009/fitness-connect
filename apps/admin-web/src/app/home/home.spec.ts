import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, type User } from '@fitness-connect/auth';
import { ApiClient } from '@fitness-connect/data-access';
import { Subject } from 'rxjs';
import { Home } from './home';

@Component({ template: 'login' })
class LoginStub {}

const admin: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'admin@example.com',
  displayName: 'Ada Admin',
  role: 'admin',
};

describe('Home', () => {
  const user = signal<User | null>(admin);
  const signOut = vi.fn(() => user.set(null));
  let me: Subject<User>;
  const getMe = vi.fn(() => me);

  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginStub },
          { path: '', component: Home },
        ]),
        {
          provide: AuthService,
          useValue: {
            user,
            isAuthenticated: computed(() => user() !== null),
            signOut,
          },
        },
        { provide: ApiClient, useValue: { getMe } },
      ],
    });
    const harness = await RouterTestingHarness.create('/');
    const root = harness.routeNativeElement as HTMLElement;
    return { harness, root, router: TestBed.inject(Router) };
  }

  async function settle(harness: RouterTestingHarness): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function signOutButton(root: HTMLElement): HTMLButtonElement {
    const button = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign out'),
    );
    if (!button) {
      throw new Error('Sign out button not found');
    }
    return button;
  }

  beforeEach(() => {
    me = new Subject<User>();
    user.set(admin);
    signOut.mockClear();
    getMe.mockClear();
  });

  it('confirms the session with the API on load', async () => {
    await setup();

    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while the session is being confirmed', async () => {
    const { harness, root } = await setup();
    harness.detectChanges();

    const status = root.querySelector('fc-alert [role="status"]');
    expect(status?.textContent).toContain('Loading');
    expect(root.querySelector('h1')).toBeNull();
  });

  it('shows the display name, email and role of the confirmed user', async () => {
    const { harness, root } = await setup();

    me.next(admin);
    await settle(harness);

    expect(root.querySelector('h1')?.textContent).toContain('Ada Admin');
    expect(root.querySelector('fc-text')?.textContent).toContain('admin@example.com');
    expect(root.querySelector('fc-text')?.textContent).toContain('admin');
    expect(root.querySelector('fc-alert')).toBeNull();
  });

  it('shows an error alert when the API rejects the session check', async () => {
    const { harness, root } = await setup();

    me.error(new Error('boom'));
    await settle(harness);

    const alert = root.querySelector('fc-alert [role="alert"]');
    expect(alert?.textContent).toContain('Could not confirm your session');
    expect(root.querySelector('h1')).toBeNull();
  });

  it('signs out and navigates to /login', async () => {
    const { harness, root, router } = await setup();
    me.next(admin);
    await settle(harness);

    signOutButton(root).click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/login');
  });

  it('keeps the sign out button available when the session check fails', async () => {
    const { harness, root, router } = await setup();
    me.error(new Error('boom'));
    await settle(harness);

    signOutButton(root).click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/login');
  });
});
