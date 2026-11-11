import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient } from '@fitness-connect/data-access';
import {
  FcAlert,
  FcButton,
  FcCard,
  FcHeading,
  FcPage,
  FcStack,
  FcText,
} from '@fitness-connect/ui';

/**
 * Signed-in landing page of the admin app. Confirms the session against the API (`GET /v1/me`)
 * and shows who is signed in. A placeholder for the real back office features.
 */
@Component({
  selector: 'fc-home',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcAlert, FcButton],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack gap="lg">
          @if (me.isLoading()) {
            <fc-alert>Loading your profile...</fc-alert>
          } @else if (me.error()) {
            <fc-alert variant="error">
              Could not confirm your session. Please try again.
            </fc-alert>
          } @else if (me.value(); as user) {
            <fc-heading>{{ user.displayName }}</fc-heading>
            <fc-text variant="muted">{{ user.email }} · {{ user.role }}</fc-text>
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

  protected readonly me = rxResource({ stream: () => this.api.getMe() });

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/login');
  }
}
