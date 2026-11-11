import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, type User } from '@fitness-connect/auth';
import { ApiClient, ApiError } from '@fitness-connect/data-access';
import { Subject } from 'rxjs';
import { Home } from './home';

const trainer: User = {
  id: '5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40',
  email: 'trainer@example.com',
  displayName: 'Tina Trainer',
  role: 'trainer',
};

describe('Home', () => {
  const user = signal<User | null>(trainer);
  let me$ = new Subject<User>();
  const signOut = vi.fn(() => user.set(null));
  const getMe = vi.fn(() => me$);

  function render() {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture;
  }

  function el(fixture: { nativeElement: unknown }): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    user.set(trainer);
    signOut.mockClear();
    getMe.mockClear();
    me$ = new Subject<User>();
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
  });

  it('greets the signed-in user by display name', () => {
    const fixture = render();

    expect(el(fixture).querySelector('h1')?.textContent).toContain(
      'Tina Trainer',
    );
  });

  it('shows the email and the role of the user', () => {
    const fixture = render();

    const text = el(fixture).querySelector('fc-text')?.textContent;
    expect(text).toContain('trainer@example.com');
    expect(text).toContain('trainer');
  });

  it('confirms the session once by calling getMe', () => {
    render();

    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state until the API answers', async () => {
    const fixture = render();
    const alert = el(fixture).querySelector('fc-alert');

    expect(alert?.textContent).toContain('Checking your session');
    expect(alert?.querySelector('[role="status"]')).not.toBeNull();

    me$.next(trainer);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el(fixture).querySelector('fc-alert')).toBeNull();
  });

  it('shows an error alert when the API call fails', async () => {
    const fixture = render();

    me$.error(
      new ApiError(500, {
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Database is down',
      }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const alert = el(fixture).querySelector('fc-alert [role="alert"]');
    expect(alert?.textContent).toContain('Database is down');
    expect(el(fixture).textContent).not.toContain('Checking your session');
  });

  it('has a secondary "Sign out" button', () => {
    const fixture = render();

    const button = el(fixture).querySelector('fc-button');
    expect(button?.textContent?.trim()).toBe('Sign out');
    expect(button?.querySelector('button')?.classList).toContain(
      'mat-mdc-outlined-button',
    );
  });

  it('signs out and navigates to /login when "Sign out" is clicked', async () => {
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const fixture = render();

    el(fixture).querySelector('button')?.click();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login');
    await fixture.whenStable();
  });
});
