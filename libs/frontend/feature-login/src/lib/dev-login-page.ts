import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  type FieldTree,
  email,
  form,
  required,
} from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DevAuthService,
  InvalidCredentialsError,
  WrongRoleError,
} from '@fitness-connect/auth';
import {
  FcAlert,
  FcButton,
  FcCard,
  FcForm,
  FcFormField,
  FcHeading,
  FcPage,
  FcPasswordInput,
  FcStack,
  FcText,
  FcTextInput,
} from '@fitness-connect/ui';
import { injectLoginConfig } from './login-config';
import { resolveReturnUrl } from './return-url';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Development-only sign-in with an email and password, backed by `DevAuthService`. Register it
 * through `loginRoutes`, which leaves it out of production.
 */
@Component({
  selector: 'fc-dev-login-page',
  imports: [
    FormField,
    FcPage,
    FcCard,
    FcStack,
    FcHeading,
    FcText,
    FcAlert,
    FcForm,
    FcFormField,
    FcTextInput,
    FcPasswordInput,
    FcButton,
  ],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack>
          <fc-heading>{{ config.title }}</fc-heading>
          <fc-text variant="small"
            >Development only. This form does not exist in production.</fc-text
          >
          @if (errorMessage(); as message) {
            <fc-alert variant="error">{{ message }}</fc-alert>
          }
          <fc-form [form]="loginForm">
            <fc-stack>
              <fc-form-field label="Email" [error]="errorOf(loginForm.email)">
                <fc-text-input
                  type="email"
                  autocomplete="username"
                  [formField]="loginForm.email"
                />
              </fc-form-field>
              <fc-form-field
                label="Password"
                [error]="errorOf(loginForm.password)"
              >
                <fc-password-input [formField]="loginForm.password" />
              </fc-form-field>
              <fc-button type="submit" [loading]="loginForm().submitting()"
                >Sign in</fc-button
              >
            </fc-stack>
          </fc-form>
        </fc-stack>
      </fc-card>
    </fc-page>
  `,
})
export class DevLoginPage {
  private readonly devAuth = inject(DevAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly config = injectLoginConfig();
  protected readonly errorMessage = signal<string | null>(null);

  private readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.password, { message: 'Password is required' });
    },
    { submission: { action: () => this.signIn() } },
  );

  /** The first error of a field, shown only once the user touched the field or tried to submit. */
  protected errorOf(field: FieldTree<string>): string {
    const state = field();
    return state.touched() ? (state.errors()[0]?.message ?? '') : '';
  }

  /** Never rejects: failures become the message in the alert. Overlapping submits are blocked by the form. */
  private async signIn(): Promise<undefined> {
    this.errorMessage.set(null);
    const { email: address, password } = this.model();

    try {
      await this.devAuth.login(address, password, this.config.expectedRole);
    } catch (error) {
      this.errorMessage.set(this.messageFor(error));
      return;
    }

    const returnUrl = resolveReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
      this.config.homePath,
    );
    await this.router.navigateByUrl(returnUrl);
  }

  private messageFor(error: unknown): string {
    if (error instanceof InvalidCredentialsError)
      return 'Invalid email or password';
    if (error instanceof WrongRoleError)
      return `This account cannot sign in to the ${this.config.expectedRole} app`;
    return GENERIC_ERROR;
  }
}
