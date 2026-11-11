import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import {
  FcButton,
  FcCard,
  FcHeading,
  FcPage,
  FcStack,
  FcText,
} from '@fitness-connect/ui';
import { injectLoginConfig } from './login-config';
import { resolveReturnUrl } from './return-url';

/**
 * Landing page of an app: a "Sign in" button that starts the sign-in flow. Users who are already
 * signed in with the expected role are sent on to the return URL (or the home path) instead.
 */
@Component({
  selector: 'fc-login-page',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcButton],
  template: `
    @if (!redirecting()) {
      <fc-page>
        <fc-card>
          <fc-stack>
            <fc-heading>{{ config.title }}</fc-heading>
            @if (config.description) {
              <fc-text variant="muted">{{ config.description }}</fc-text>
            }
            <fc-button (click)="signIn()">Sign in</fc-button>
          </fc-stack>
        </fc-card>
      </fc-page>
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly config = injectLoginConfig();
  protected readonly redirecting = computed(
    () => this.auth.user()?.role === this.config.expectedRole,
  );

  constructor() {
    effect(() => {
      if (this.redirecting()) {
        void this.router.navigateByUrl(this.returnUrl(), { replaceUrl: true });
      }
    });
  }

  protected signIn(): void {
    this.auth.signIn(this.returnUrl());
  }

  private returnUrl(): string {
    return resolveReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
      this.config.homePath,
    );
  }
}
