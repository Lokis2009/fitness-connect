import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

type SessionCheck = 'loading' | 'confirmed' | 'failed';

/**
 * Signed-in landing page of the client app. Placeholder for real features: it greets the user,
 * confirms the session against the API and offers sign out.
 */
@Component({
  selector: 'fc-home',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcAlert, FcButton],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack>
          <fc-heading>Welcome, {{ displayName() }}</fc-heading>
          @switch (check()) {
            @case ('loading') {
              <fc-alert>Loading your account…</fc-alert>
            }
            @case ('failed') {
              <fc-alert variant="error">
                We could not confirm your session. Please try again later.
              </fc-alert>
            }
            @default {
              <fc-text variant="muted">{{ summary() }}</fc-text>
            }
          }
          <fc-button variant="secondary" (click)="signOut()">Sign out</fc-button>
        </fc-stack>
      </fc-card>
    </fc-page>
  `,
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  protected readonly check = signal<SessionCheck>('loading');
  protected readonly displayName = computed(() => this.auth.user()?.displayName ?? '');
  protected readonly summary = computed(() => {
    const user = this.auth.user();
    return user ? `${user.email} · ${user.role}` : '';
  });

  constructor() {
    this.api
      .getMe()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => this.check.set('confirmed'),
        error: () => this.check.set('failed'),
      });
  }

  protected async signOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
