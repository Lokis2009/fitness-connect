import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, type User } from '@fitness-connect/data-access';
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
 * Signed-in landing page shared by the client, trainer and admin apps. Placeholder for real
 * features: it greets the user, confirms the session against the API and offers sign out.
 */
@Component({
  selector: 'fc-signed-in-home',
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
export class SignedInHome {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  protected readonly check = signal<SessionCheck>('loading');
  /**
   * The user captured when sign-out starts. Sign out clears the auth user before navigation to
   * `/login` finishes, so the page keeps showing this user instead of an empty greeting.
   */
  private readonly signingOutUser = signal<User | null>(null);
  private signingOut = false;
  private readonly shownUser = computed(
    () => this.signingOutUser() ?? this.auth.user(),
  );
  protected readonly displayName = computed(
    () => this.shownUser()?.displayName ?? '',
  );
  protected readonly summary = computed(() => {
    const user = this.shownUser();
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
    // A repeated click would start a second navigation that cancels the first.
    if (this.signingOut) {
      return;
    }
    this.signingOut = true;
    this.signingOutUser.set(this.auth.user());
    this.auth.signOut();
    let navigated = false;
    try {
      navigated = await this.router.navigateByUrl('/login');
    } finally {
      // The page stays when navigation fails, so stop showing the old user. A navigation that
      // was cancelled by a newer one (such as the 401 redirect) is still leaving the page.
      if (!navigated && !this.router.currentNavigation()) {
        this.signingOutUser.set(null);
        this.signingOut = false;
      }
    }
  }
}
