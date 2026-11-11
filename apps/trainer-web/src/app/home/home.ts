import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, ApiError } from '@fitness-connect/data-access';
import {
  FcAlert,
  FcButton,
  FcCard,
  FcHeading,
  FcPage,
  FcStack,
  FcText,
} from '@fitness-connect/ui';

/** Signed-in landing page of the trainer app. Placeholder for the real features. */
@Component({
  selector: 'fc-home',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcAlert, FcButton],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack>
          @if (user(); as user) {
            <fc-heading>{{ user.displayName }}</fc-heading>
            <fc-text variant="muted">{{ user.email }} ({{ user.role }})</fc-text>
          }
          @if (session.isLoading()) {
            <fc-alert>Checking your session...</fc-alert>
          } @else if (errorMessage(); as message) {
            <fc-alert variant="error">{{ message }}</fc-alert>
          }
          <fc-button variant="secondary" (click)="signOut()">Sign out</fc-button>
        </fc-stack>
      </fc-card>
    </fc-page>
  `,
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiClient);

  protected readonly user = this.auth.user;
  /** Confirms the session against the API; a 401 is handled by the auth interceptor. */
  protected readonly session = rxResource({ stream: () => this.api.getMe() });
  protected readonly errorMessage = computed(() => {
    const error = this.session.error();
    return error ? ApiError.from(error).message : null;
  });

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/login');
  }
}
