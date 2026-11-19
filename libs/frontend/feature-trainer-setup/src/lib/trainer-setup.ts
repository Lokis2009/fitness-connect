import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { trainerStatusOf } from '@fitness-connect/trainer-access';
import {
  FcButton,
  FcCard,
  FcHeading,
  FcPage,
  FcStack,
  FcState,
  FcText,
} from '@fitness-connect/ui';

interface StatusMessage {
  readonly heading: string;
  readonly body: string;
}

const MESSAGES = {
  incomplete: {
    heading: 'Your profile is not ready yet',
    body: 'Profile setup is not available yet. Your account is waiting for it.',
  },
  submitted: {
    heading: 'Your profile is under review',
    body: 'An admin is reviewing your profile. Check again later.',
  },
  changes_requested: {
    heading: 'Changes needed',
    body: 'An admin asked for changes.',
  },
  approved: {
    heading: 'Your profile is approved',
    body: 'Taking you to your home page.',
  },
} satisfies Record<string, StatusMessage>;

const UNKNOWN_MESSAGE: StatusMessage = {
  heading: 'We could not read your status',
  body: 'Check again to update it.',
};

const NO_NOTE = 'No reason was given.';

/**
 * Read-only trainer setup page (`/setup`): shows the approval status, the admin's note when changes
 * were requested, and lets the trainer check again or sign out. Refreshes the user on entry and
 * moves an approved trainer on to `/`.
 */
@Component({
  selector: 'fc-trainer-setup',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcState, FcButton],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack>
          <fc-heading>{{ message().heading }}</fc-heading>
          <fc-text variant="muted">{{ message().body }}</fc-text>
          @if (note(); as note) {
            <fc-text>{{ note }}</fc-text>
          }
          @if (failed()) {
            <fc-state variant="error" title="Could not check your status">
              Your status may have changed. Check your connection and try again.
              <fc-button fcStateAction variant="text" (click)="check()">Try again</fc-button>
            </fc-state>
          }
          <fc-button [loading]="checking()" loadingLabel="Checking" (click)="check()">
            Check again
          </fc-button>
          <fc-button variant="secondary" (click)="signOut()">Sign out</fc-button>
        </fc-stack>
      </fc-card>
    </fc-page>
  `,
})
export class TrainerSetup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly checking = signal(false);
  protected readonly failed = signal(false);

  private readonly status = computed(() => trainerStatusOf(this.auth.user()));
  protected readonly message = computed<StatusMessage>(() => {
    const status = this.status();
    return status ? MESSAGES[status] : UNKNOWN_MESSAGE;
  });
  protected readonly note = computed(() => {
    if (this.status() !== 'changes_requested') {
      return null;
    }
    return this.auth.user()?.trainerStatusNote?.trim() || NO_NOTE;
  });

  constructor() {
    void this.check();
  }

  /** Reloads the user and moves on to `/` once approved. A failure keeps the last status. */
  protected async check(): Promise<void> {
    this.checking.set(true);
    try {
      await this.auth.refreshUser();
      this.failed.set(false);
    } catch {
      this.failed.set(true);
      return;
    } finally {
      this.checking.set(false);
    }
    if (this.status() === 'approved') {
      await this.router.navigateByUrl('/');
    }
  }

  protected async signOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
