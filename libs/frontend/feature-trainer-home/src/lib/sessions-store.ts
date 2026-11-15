import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, ApiError, type Session, type SessionList } from '@fitness-connect/data-access';
import { type Observable, catchError, map, of } from 'rxjs';
import { isValidTimeZone } from '@fitness-connect/ui';
import { ClockService } from './clock.service';
import { dayOf, dayWindow, hasEnded } from './day-window';
import { isNotApproved, leaveWhenNotApproved } from './not-approved';
import { RefreshQueue } from './refresh-queue';
import { refreshTrigger } from './refresh-trigger';
import type { LoadState } from './requests-store';

type SessionsResult =
  | { ok: true; list: SessionList; sentAt: number }
  | { ok: false; error: ApiError | null };

/**
 * Confirmed sessions of today and tomorrow in the venue's time zone. Provided in `TrainerHome`'s
 * `providers`, so it lives until the page is left.
 */
@Service({ autoProvided: false })
export class SessionsStore {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly clock = inject(ClockService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly items = signal<Session[]>([]);
  private readonly load = signal<LoadState>('loading');
  private readonly updated = signal<number | null>(null);
  private readonly failed = signal(false);
  private readonly queue = new RefreshQueue(refreshTrigger(), () => this.fetch());

  /**
   * IANA zone of the trainer's venue, or `null` while it is unknown or not a zone `Intl` knows.
   * The zone is stored text, and a typo would make the day arithmetic throw.
   */
  private readonly zone = computed(() => {
    const zone = this.auth.user()?.trainerVenueTimeZone ?? null;
    return zone !== null && isValidTimeZone(zone) ? zone : null;
  });

  /** Sessions that have not ended, split by day. Recomputed as the clock passes each end. */
  private readonly days = computed(() => {
    const zone = this.zone();
    const now = this.clock.now();
    const today: Session[] = [];
    const tomorrow: Session[] = [];
    if (zone === null) {
      return { today, tomorrow };
    }
    const sorted = [...this.items()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    for (const session of sorted) {
      const startsAt = Date.parse(session.startsAt);
      if (hasEnded(startsAt, session.durationMinutes, now)) {
        continue;
      }
      // A session that started before today and is still running has no day of its own: it is
      // shown under today until it ends.
      const day = dayOf(startsAt, zone, now) ?? (startsAt < now ? 'today' : null);
      if (day === 'today') {
        today.push(session);
      } else if (day === 'tomorrow') {
        tomorrow.push(session);
      }
    }
    return { today, tomorrow };
  });

  readonly today = computed(() => this.days().today);
  readonly tomorrow = computed(() => this.days().tomorrow);
  readonly loadState = this.load.asReadonly();

  /** Epoch milliseconds of the last successful load, or `null` before the first one. */
  readonly lastUpdated = this.updated.asReadonly();

  /** `true` when the last refresh failed and the list on screen is from an earlier load. */
  readonly refreshFailed = this.failed.asReadonly();

  constructor() {
    this.queue.results
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.ok) {
          this.apply(result.list, result.sentAt);
        } else {
          void this.failRefresh(result.error);
        }
      });
  }

  refresh(): void {
    this.queue.refresh();
  }

  /**
   * Fetches again after the request in flight, if any. The list on screen may predate the accept
   * that created a session, so unlike a poll this trigger is never dropped.
   */
  refreshAfterAccept(): void {
    this.queue.refreshAfterInFlight();
  }

  /** Loads again after a failed first load, showing the loading state meanwhile. */
  retry(): void {
    if (this.load() === 'error') {
      this.load.set('loading');
    }
    this.refresh();
  }

  private fetch(): Observable<SessionsResult> {
    const zone = this.zone();
    if (zone === null) {
      // Without the venue zone "today" is unknown. That is an error, never an empty list.
      return of<SessionsResult>({ ok: false, error: null });
    }
    const range = dayWindow(this.clock.now(), zone);
    const sentAt = this.clock.deviceNow();
    return this.api.getSessions(new Date(range.from).toISOString(), new Date(range.to).toISOString()).pipe(
      map((list): SessionsResult => ({ ok: true, list, sentAt })),
      catchError((error: unknown) => of<SessionsResult>({ ok: false, error: ApiError.from(error) })),
    );
  }

  private apply(list: SessionList, sentAt: number): void {
    this.clock.sync(list.serverTime, sentAt);
    this.updated.set(this.clock.now());
    this.failed.set(false);
    this.load.set('ready');
    this.items.set(list.items);
  }

  private async failRefresh(error: ApiError | null): Promise<void> {
    if (error && isNotApproved(error) && (await leaveWhenNotApproved(this.auth, this.router))) {
      return;
    }
    if (this.updated() === null) {
      this.load.set('error');
    } else {
      this.failed.set(true);
    }
  }
}
