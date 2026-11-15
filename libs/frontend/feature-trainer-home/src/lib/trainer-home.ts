import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import type { Session } from '@fitness-connect/data-access';
import {
  FcBadge,
  FcButton,
  FcCard,
  FcDeadline,
  FcHeading,
  FcMoneyPipe,
  FcPage,
  FcScrollIntoView,
  FcSkeleton,
  FcStack,
  FcState,
  FcText,
  FcTime,
  UI_LOCALE,
  zoneCity,
} from '@fitness-connect/ui';
import { map } from 'rxjs';
import { ClockService } from './clock.service';
import { LATE_WINDOW_MS } from './late-window';
import { RequestsStore, isOpenCard } from './requests-store';
import type { CardAction, RequestCard } from './request-card-state';
import { SessionsStore } from './sessions-store';

type CardLayout = 'accepted' | 'declined' | 'unavailable' | 'open';

interface DayGroup {
  key: 'today' | 'tomorrow';
  /** Any instant on that day, for the `fc-time` heading. */
  value: string;
  sessions: Session[];
}

const UNAVAILABLE_TEXT = {
  expired: 'This request expired before you answered.',
  withdrawn: 'The client withdrew this request.',
  answered: 'This request was already answered.',
} as const;

/**
 * Trainer home: pending booking requests and today's and tomorrow's confirmed sessions. It
 * provides both stores, so they live until the page is left.
 */
@Component({
  selector: 'fc-trainer-home',
  imports: [
    FcPage,
    FcStack,
    FcHeading,
    FcText,
    FcButton,
    FcCard,
    FcBadge,
    FcTime,
    FcDeadline,
    FcSkeleton,
    FcState,
    FcMoneyPipe,
    FcScrollIntoView,
  ],
  providers: [RequestsStore, SessionsStore],
  template: `
    <fc-page align="top">
      <fc-stack gap="xl">
        <fc-stack direction="horizontal" gap="lg">
          <fc-stack gap="xs">
            <fc-heading>Trainer home</fc-heading>
            @if (subtitle(); as text) {
              <fc-text variant="muted">{{ text }}</fc-text>
            }
          </fc-stack>
          <fc-button variant="text" (click)="signOut()">Sign out</fc-button>
        </fc-stack>

        @if (showNotice()) {
          <fc-state variant="info">
            That request is no longer available. It may have expired, been answered, or belong to
            another trainer.
          </fc-state>
        }

        <fc-stack gap="md">
          <fc-stack direction="horizontal" gap="sm">
            <fc-heading level="2">Booking requests</fc-heading>
            @if (requests.loadState() === 'ready') {
              <fc-badge>{{ openCount() }}</fc-badge>
            }
          </fc-stack>

          @if (requests.refreshFailed()) {
            <fc-text variant="small">{{ refreshFailedText(requests.lastUpdated()) }}</fc-text>
          }

          @switch (requests.loadState()) {
            @case ('loading') {
              <fc-skeleton [lines]="3" [actions]="true" />
              <fc-skeleton [lines]="3" [actions]="true" />
            }
            @case ('error') {
              <fc-state variant="error" title="Could not load requests">
                Requests may be waiting for you. Check your connection and try again.
                <fc-button fcStateAction variant="text" (click)="requests.retry()">Try again</fc-button>
              </fc-state>
            }
            @default {
              @for (card of requests.cards(); track card.request.id) {
                @switch (layout(card)) {
                  @case ('accepted') {
                    <fc-card size="full">
                      <fc-stack gap="sm">
                        <fc-heading level="3">{{ card.request.clientName }}</fc-heading>
                        <fc-badge>Accepted</fc-badge>
                        <fc-text variant="muted">Accepted.</fc-text>
                        <fc-time [value]="bookingStart(card)" [timeZone]="card.request.venue.timeZone" />
                      </fc-stack>
                    </fc-card>
                  }
                  @case ('declined') {
                    <fc-card size="full">
                      <fc-stack gap="sm">
                        <fc-heading level="3">{{ card.request.clientName }}</fc-heading>
                        <fc-badge>Declined</fc-badge>
                        <fc-text variant="muted">Declined. No reason was sent.</fc-text>
                      </fc-stack>
                    </fc-card>
                  }
                  @case ('unavailable') {
                    <fc-card size="full">
                      <fc-stack gap="sm">
                        <fc-heading level="3">{{ card.request.clientName }}</fc-heading>
                        <fc-badge>No longer available</fc-badge>
                        <fc-text variant="muted">{{ unavailableText(card) }}</fc-text>
                      </fc-stack>
                    </fc-card>
                  }
                  @default {
                    <fc-card
                      size="full"
                      [highlighted]="isHighlighted(card)"
                      [fcScrollIntoView]="isHighlighted(card)"
                    >
                      <fc-stack gap="sm">
                        <fc-heading level="3">{{ card.request.clientName }}</fc-heading>
                        @if (isHighlighted(card)) {
                          <fc-badge>Opened from email</fc-badge>
                        }
                        <fc-time
                          [value]="card.request.startsAt"
                          [timeZone]="card.request.venue.timeZone"
                          [now]="clock.now()"
                        />
                        <fc-text variant="muted">
                          {{ card.request.priceMinor | fcMoney: card.request.currency }} ·
                          {{ card.request.venue.name }}
                        </fc-text>
                        <fc-stack direction="horizontal" gap="sm">
                          <fc-deadline
                            [until]="card.request.expiresAt"
                            [now]="clock.now()"
                            [timeZone]="card.request.venue.timeZone"
                          />
                          @if (card.state.kind === 'expired') {
                            <fc-badge>Expired</fc-badge>
                          }
                        </fc-stack>
                        @if (isLate(card)) {
                          <fc-text variant="small">
                            Session starts within 3 hours. Cancelling later will be flagged.
                          </fc-text>
                        }
                        @if (card.state.kind === 'expired') {
                          <fc-text variant="small">The 1-hour response window has ended.</fc-text>
                        }
                        @if (card.state.kind === 'failed') {
                          <fc-state variant="error">
                            We could not reach the server. Your answer may not have been saved.
                            <fc-button fcStateAction variant="text" (click)="requests.retryAnswer(card.request.id)">
                              Retry
                            </fc-button>
                          </fc-state>
                        }
                        <fc-stack direction="horizontal" gap="md">
                          <fc-button
                            variant="primary"
                            loadingLabel="Accepting"
                            [loading]="isSubmitting(card, 'accept')"
                            [disabled]="isLocked(card)"
                            (click)="requests.accept(card.request.id)"
                          >
                            Accept
                          </fc-button>
                          <fc-button
                            variant="secondary"
                            loadingLabel="Declining"
                            [loading]="isSubmitting(card, 'decline')"
                            [disabled]="isLocked(card)"
                            (click)="requests.decline(card.request.id)"
                          >
                            Decline
                          </fc-button>
                        </fc-stack>
                      </fc-stack>
                    </fc-card>
                  }
                }
              } @empty {
                <fc-state variant="empty" title="No requests waiting">
                  New booking requests appear here as soon as a client books you.
                </fc-state>
              }
            }
          }
        </fc-stack>

        <fc-stack gap="md">
          <fc-heading level="2">Today and tomorrow</fc-heading>

          @if (sessions.refreshFailed()) {
            <fc-text variant="small">{{ refreshFailedText(sessions.lastUpdated()) }}</fc-text>
          }

          @switch (sessions.loadState()) {
            @case ('loading') {
              <fc-skeleton [lines]="2" />
            }
            @case ('error') {
              <fc-state variant="error" title="Could not load sessions">
                Your schedule may not be empty. Check your connection and try again.
                <fc-button fcStateAction variant="text" (click)="sessions.retry()">Try again</fc-button>
              </fc-state>
            }
            @default {
              @for (group of groups(); track group.key) {
                <fc-stack gap="sm">
                  <fc-heading level="3">
                    <fc-time
                      format="day"
                      [value]="group.value"
                      [timeZone]="zone() ?? 'UTC'"
                      [now]="clock.now()"
                    />
                  </fc-heading>
                  @for (session of group.sessions; track session.id) {
                    <fc-card size="full">
                      <fc-stack direction="horizontal" gap="lg">
                        <fc-time
                          format="range"
                          [value]="session.startsAt"
                          [timeZone]="session.venue.timeZone"
                          [durationMinutes]="session.durationMinutes"
                        />
                        <fc-stack gap="xs">
                          <fc-text>{{ session.clientName }}</fc-text>
                          <fc-text variant="muted">{{ session.venue.name }}</fc-text>
                        </fc-stack>
                      </fc-stack>
                    </fc-card>
                  }
                </fc-stack>
              } @empty {
                <fc-state variant="empty" title="No sessions today or tomorrow">
                  Confirmed sessions show up here.
                </fc-state>
              }
            }
          }
        </fc-stack>
      </fc-stack>
    </fc-page>
  `,
})
export class TrainerHome {
  protected readonly requests = inject(RequestsStore);
  protected readonly sessions = inject(SessionsStore);
  protected readonly clock = inject(ClockService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly zone = computed(() => this.auth.user()?.trainerVenueTimeZone ?? null);

  protected readonly subtitle = computed(() => {
    const zone = this.zone();
    return zone === null ? null : `Times are shown in ${zoneCity(zone)} time.`;
  });

  /** Number on the "Booking requests" badge: cards the trainer can still answer. */
  protected readonly openCount = computed(() => this.requests.cards().filter(isOpenCard).length);

  /** The booking id in `?request=`, from the email link. */
  private readonly linkedId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('request'))),
    { initialValue: this.route.snapshot.queryParamMap.get('request') },
  );

  /** `found` or `missing` once the first load decided it, `null` without a link or before then. */
  private readonly link = computed(() => {
    const id = this.linkedId();
    const ids = this.requests.firstLoadIds();
    if (!id || !ids) {
      return null;
    }
    return ids.has(id) ? 'found' : 'missing';
  });

  /** The notice for a dead link ends when the trainer answers any card. */
  protected readonly showNotice = computed(
    () => this.link() === 'missing' && !this.requests.cards().some((card) => this.isAnswered(card)),
  );

  protected readonly groups = computed((): DayGroup[] => {
    const today = this.sessions.today();
    const tomorrow = this.sessions.tomorrow();
    const groups: DayGroup[] = [];
    if (today.length > 0) {
      groups.push({ key: 'today', value: new Date(this.clock.now()).toISOString(), sessions: today });
    }
    if (tomorrow.length > 0) {
      groups.push({ key: 'tomorrow', value: tomorrow[0].startsAt, sessions: tomorrow });
    }
    return groups;
  });

  protected layout(card: RequestCard): CardLayout {
    switch (card.state.kind) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'unavailable':
        return 'unavailable';
      default:
        return 'open';
    }
  }

  protected bookingStart(card: RequestCard): string {
    return card.state.kind === 'accepted' ? card.state.booking.startsAt : card.request.startsAt;
  }

  protected unavailableText(card: RequestCard): string {
    return card.state.kind === 'unavailable' ? UNAVAILABLE_TEXT[card.state.reason] : '';
  }

  /** The card of the email link, until the trainer answers it. */
  protected isHighlighted(card: RequestCard): boolean {
    return this.link() === 'found' && this.linkedId() === card.request.id && !this.isAnswered(card);
  }

  /** Under 3 hours to the session, on a card that can still be answered. */
  protected isLate(card: RequestCard): boolean {
    return (
      isOpenCard(card) && Date.parse(card.request.startsAt) - this.clock.now() < LATE_WINDOW_MS
    );
  }

  protected isSubmitting(card: RequestCard, action: CardAction): boolean {
    return card.state.kind === 'submitting' && card.state.action === action;
  }

  /** Both buttons are off while an answer is in flight, and on an expired card. */
  protected isLocked(card: RequestCard): boolean {
    return card.state.kind === 'submitting' || card.state.kind === 'expired';
  }

  protected refreshFailedText(lastUpdated: number | null): string {
    if (lastUpdated === null) {
      return 'Could not refresh.';
    }
    const time = new Intl.DateTimeFormat(UI_LOCALE, {
      timeZone: this.zone() ?? undefined,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(lastUpdated);
    return `Could not refresh. Showing the update from ${time}.`;
  }

  protected async signOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }

  /** The trainer has acted on this card (any state other than idle or expired). */
  private isAnswered(card: RequestCard): boolean {
    return card.state.kind !== 'idle' && card.state.kind !== 'expired';
  }
}
