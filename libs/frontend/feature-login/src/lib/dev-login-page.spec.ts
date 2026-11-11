import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  DevAuthService,
  InvalidCredentialsError,
  WrongRoleError,
} from '@fitness-connect/auth';
import type { Role, User } from '@fitness-connect/data-access';
import { DevLoginPage } from './dev-login-page';
import { LOGIN_CONFIG_DATA_KEY, type LoginConfig } from './login-config';

@Component({ template: 'home' })
class HomeStub {}

const config: LoginConfig = {
  title: 'Trainer sign in',
  expectedRole: 'trainer',
  homePath: '/home',
};

function userWithRole(role: Role): User {
  return {
    id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
    email: `${role}@example.com`,
    displayName: role,
    role,
  };
}

describe('DevLoginPage', () => {
  const login = vi.fn<DevAuthService['login']>();

  async function setup(url = '/dev-login') {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'dev-login',
            component: DevLoginPage,
            data: { [LOGIN_CONFIG_DATA_KEY]: config },
          },
          { path: 'home', component: HomeStub },
          { path: 'ok', component: HomeStub },
        ]),
        { provide: DevAuthService, useValue: { login } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const root = harness.routeNativeElement as HTMLElement;
    const whenStable = () => harness.fixture.whenStable();

    const emailInput = () =>
      root.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = () =>
      root.querySelector(
        'input[autocomplete="current-password"]',
      ) as HTMLInputElement;
    const submitButton = () =>
      root.querySelector('button[type="submit"]') as HTMLButtonElement;
    const alert = () =>
      root.querySelector('[role="alert"]') as HTMLElement | null;
    const errorTexts = () =>
      Array.from(root.querySelectorAll('[data-fc-error]')).map((e) =>
        e.textContent?.trim(),
      );

    async function type(input: HTMLInputElement, text: string) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await whenStable();
    }
    async function blur(input: HTMLInputElement) {
      input.dispatchEvent(new Event('blur'));
      await whenStable();
    }
    async function fillIn(email = 'trainer@example.com', password = 'secret') {
      await type(emailInput(), email);
      await type(passwordInput(), password);
    }
    async function submit() {
      submitButton().click();
      await whenStable();
    }

    return {
      harness,
      root,
      router: TestBed.inject(Router),
      whenStable,
      emailInput,
      passwordInput,
      submitButton,
      alert,
      errorTexts,
      type,
      blur,
      fillIn,
      submit,
    };
  }

  beforeEach(() => {
    login.mockReset();
  });

  describe('form', () => {
    it('has labelled email and password fields and a submit button', async () => {
      const { root, emailInput, passwordInput, submitButton } = await setup();

      const labelFor = (text: string) =>
        Array.from(root.querySelectorAll('label')).find(
          (l) => l.textContent?.trim() === text,
        );
      expect(labelFor('Email')?.getAttribute('for')).toBe(emailInput().id);
      expect(labelFor('Password')?.getAttribute('for')).toBe(
        passwordInput().id,
      );
      expect(submitButton().textContent?.trim()).toBe('Sign in');
    });

    it('mentions that the page is for development only', async () => {
      const { root } = await setup();

      expect(root.textContent).toContain('Development only');
      expect(root.querySelector('h1')?.textContent).toContain(
        'Trainer sign in',
      );
    });

    it('shows no field errors before the user touched anything', async () => {
      const { errorTexts, alert } = await setup();

      expect(errorTexts()).toEqual([]);
      expect(alert()).toBeNull();
    });

    it('shows the required errors only after submitting an empty form, and does not call the API', async () => {
      const { submit, errorTexts } = await setup();

      await submit();

      expect(errorTexts()).toEqual([
        'Email is required',
        'Password is required',
      ]);
      expect(login).not.toHaveBeenCalled();
    });

    it('shows a field error once that field was touched', async () => {
      const { emailInput, blur, errorTexts } = await setup();

      await blur(emailInput());

      expect(errorTexts()).toEqual(['Email is required']);
    });

    it('rejects an invalid email address', async () => {
      const { emailInput, type, blur, submit, errorTexts } = await setup();

      await type(emailInput(), 'not-an-email');
      await blur(emailInput());
      await submit();

      expect(errorTexts()).toContain('Enter a valid email address');
      expect(login).not.toHaveBeenCalled();
    });

    it('clears a field error once the value is valid', async () => {
      const { emailInput, type, blur, errorTexts } = await setup();
      await blur(emailInput());
      expect(errorTexts()).toEqual(['Email is required']);

      await type(emailInput(), 'trainer@example.com');

      expect(errorTexts()).toEqual([]);
    });

    it('links the error to the field and marks a filled-in invalid field with aria-invalid', async () => {
      const { emailInput, type, submit, root } = await setup();

      await type(emailInput(), 'not-an-email');
      await submit();

      const error = root.querySelector('[data-fc-error]') as HTMLElement;
      expect(emailInput().getAttribute('aria-describedby')).toBe(error.id);
      expect(emailInput().getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('submitting', () => {
    it('signs in with the entered credentials and the expected role, then goes to the home path', async () => {
      login.mockResolvedValue(userWithRole('trainer'));
      const { fillIn, submit, router } = await setup();

      await fillIn('trainer@example.com', 'secret');
      await submit();

      expect(login).toHaveBeenCalledExactlyOnceWith(
        'trainer@example.com',
        'secret',
        'trainer',
      );
      expect(router.url).toBe('/home');
    });

    it('goes to a safe returnUrl after signing in', async () => {
      login.mockResolvedValue(userWithRole('trainer'));
      const { fillIn, submit, router } = await setup(
        '/dev-login?returnUrl=%2Fok',
      );

      await fillIn();
      await submit();

      expect(router.url).toBe('/ok');
    });

    it.each(['//evil.com', 'https://evil.com'])(
      'ignores the unsafe returnUrl %s',
      async (unsafe) => {
        login.mockResolvedValue(userWithRole('trainer'));
        const { fillIn, submit, router } = await setup(
          `/dev-login?returnUrl=${encodeURIComponent(unsafe)}`,
        );

        await fillIn();
        await submit();

        expect(router.url).toBe('/home');
      },
    );

    it('also submits when the form is submitted without a click (Enter in a field)', async () => {
      login.mockResolvedValue(userWithRole('trainer'));
      const { root, fillIn, whenStable } = await setup();
      await fillIn();

      (root.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      await whenStable();

      expect(login).toHaveBeenCalledOnce();
    });
  });

  describe('loading state', () => {
    function deferred() {
      let resolve!: (user: User) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<User>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it('shows the button as busy and disabled while signing in, and recovers afterwards', async () => {
      const pending = deferred();
      login.mockReturnValue(pending.promise);
      const { fillIn, submit, submitButton, whenStable } = await setup();
      await fillIn();

      await submit();
      expect(submitButton().getAttribute('aria-busy')).toBe('true');
      expect(submitButton().disabled).toBe(true);

      pending.reject(new Error('boom'));
      await pending.promise.catch(() => undefined);
      await whenStable();
      expect(submitButton().getAttribute('aria-busy')).toBeNull();
      expect(submitButton().disabled).toBe(false);
    });

    it('does not send a second request while one is in flight', async () => {
      const pending = deferred();
      login.mockReturnValue(pending.promise);
      const { root, fillIn, submit, whenStable } = await setup();
      await fillIn();

      await submit();
      (root.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      await submit();
      pending.resolve(userWithRole('trainer'));
      await whenStable();

      expect(login).toHaveBeenCalledOnce();
    });

    it('can submit again after a failure', async () => {
      login
        .mockRejectedValueOnce(new InvalidCredentialsError())
        .mockResolvedValueOnce(userWithRole('trainer'));
      const { fillIn, submit, router, alert } = await setup();
      await fillIn();

      await submit();
      expect(alert()).not.toBeNull();
      await submit();

      expect(login).toHaveBeenCalledTimes(2);
      expect(router.url).toBe('/home');
    });
  });

  describe('errors', () => {
    it('announces invalid credentials with a clear message', async () => {
      login.mockRejectedValue(new InvalidCredentialsError());
      const { fillIn, submit, alert, router } = await setup();
      await fillIn();

      await submit();

      expect(alert()?.textContent?.trim()).toBe('Invalid email or password');
      expect(router.url).toBe('/dev-login');
    });

    it('names the expected role when the account has another role', async () => {
      login.mockRejectedValue(new WrongRoleError('trainer', 'client'));
      const { fillIn, submit, alert } = await setup();
      await fillIn();

      await submit();

      expect(alert()?.textContent?.trim()).toBe(
        'This account cannot sign in to the trainer app',
      );
    });

    it('shows a generic message for anything else', async () => {
      login.mockRejectedValue(new Error('network down'));
      const { fillIn, submit, alert } = await setup();
      await fillIn();

      await submit();

      expect(alert()?.textContent?.trim()).toBe(
        'Something went wrong. Please try again.',
      );
      expect(alert()?.textContent).not.toContain('network down');
    });

    it('removes the previous error when submitting again', async () => {
      const pending = new Promise<User>(() => undefined);
      login
        .mockRejectedValueOnce(new InvalidCredentialsError())
        .mockReturnValueOnce(pending);
      const { fillIn, submit, alert } = await setup();
      await fillIn();
      await submit();
      expect(alert()).not.toBeNull();

      await submit();

      expect(alert()).toBeNull();
    });

    it('keeps the entered values and the focus after an error', async () => {
      login.mockRejectedValue(new InvalidCredentialsError());
      const { fillIn, submit, passwordInput, emailInput } = await setup();
      await fillIn('trainer@example.com', 'wrong');
      passwordInput().focus();

      await submit();

      expect(emailInput().value).toBe('trainer@example.com');
      expect(passwordInput().value).toBe('wrong');
      expect(document.activeElement).toBe(passwordInput());
    });
  });
});
