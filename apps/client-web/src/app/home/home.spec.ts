import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, ApiError, type User } from '@fitness-connect/data-access';
import { Subject, throwError } from 'rxjs';
import { Home } from './home';

const client: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'casey@example.com',
  displayName: 'Casey Client',
  role: 'client',
};

describe('Home', () => {
  const user = signal<User | null>(client);
  const signOut = vi.fn<() => void>();
  const getMe = vi.fn();

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
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
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, root, router: TestBed.inject(Router) };
  }

  beforeEach(() => {
    user.set(client);
    signOut.mockReset();
    getMe.mockReset();
  });

  it('greets the signed-in user with their display name', () => {
    getMe.mockReturnValue(new Subject<User>());
    const { root } = setup();

    expect(root.querySelector('h1')?.textContent).toContain('Casey Client');
  });

  it('shows a loading state while the session is being confirmed', () => {
    getMe.mockReturnValue(new Subject<User>());
    const { root } = setup();

    expect(root.querySelector('fc-alert')?.textContent).toContain('Loading');
    expect(root.textContent).not.toContain('casey@example.com');
  });

  it('shows the email and role once the API confirms the session', () => {
    const response = new Subject<User>();
    getMe.mockReturnValue(response);
    const { fixture, root } = setup();

    response.next(client);
    response.complete();
    fixture.detectChanges();

    expect(getMe).toHaveBeenCalledTimes(1);
    expect(root.querySelector('fc-alert')).toBeNull();
    expect(root.textContent).toContain('casey@example.com');
    expect(root.textContent).toContain('client');
  });

  it('shows an error alert when the API call fails', () => {
    getMe.mockReturnValue(
      throwError(
        () =>
          new ApiError(500, {
            type: 'about:blank',
            title: 'Internal Server Error',
            status: 500,
          }),
      ),
    );
    const { root } = setup();

    const alert = root.querySelector('fc-alert [role="alert"]');
    expect(alert?.textContent).toContain('could not confirm your session');
    expect(root.textContent).not.toContain('casey@example.com');
  });

  it('signs out and goes to the login page', async () => {
    getMe.mockReturnValue(new Subject<User>());
    const { fixture, root, router } = setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    root.querySelector<HTMLButtonElement>('fc-button button')?.click();
    await fixture.whenStable();

    expect(root.querySelector('fc-button')?.textContent).toContain('Sign out');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
