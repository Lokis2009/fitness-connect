import { DestroyRef, Service, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, ApiError, type BookingRequest, type BookingRequestList } from '@fitness-connect/data-access';
import { type Observable, Subject, catchError, exhaustMap, map, merge, of } from 'rxjs';
import { ClockService } from './clock.service';
import { isNotApproved, leaveWhenNotApproved } from './not-approved';
import { refreshTrigger } from './refresh-trigger';
import {
  type CardAction,
  type RequestCard,
  expireCard,
  resolveError,
  resolveSuccess,
  startSubmit,
} from './request-card-state';

/** Load state of a list: first load, loaded, or failed with no earlier data. */
export type LoadState = 'loading' | 'ready' | 'error';

type ListResult =
  | { ok: true; list: BookingRequestList }
  | { ok: false; error: ApiError };

/** A card the trainer can still answer or is answering: idle, submitting or failed. */
export function isOpenCard(card: RequestCard): boolean {
  const { kind } = card.state;
  return kind === 'idle' || kind === 'submitting' || kind === 'failed';
}

/**
 * Pending requests of the trainer: the map of cards, accept and decline, and polling. Provided in
 * `TrainerHome`'s `providers`, so it lives until the page is left.
 */
@Service({ autoProvided: false })
export class RequestsStore {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly clock = inject(ClockService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly cardMap = signal<ReadonlyMap<string, RequestCard>>(new Map());
  private readonly load = signal<LoadState>('loading');
  private readonly updated = signal<number | null>(null);
  private readonly failed = signal(false);
  private readonly firstIds = signal<ReadonlySet<string> | null>(null);
  private readonly accepted = signal(0);
  private readonly manualRefresh = new Subject<void>();

  /** Open cards by deadline, then resolved cards by deadline. */
  readonly cards = computed(() =>
    [...this.cardMap().values()].sort(
      (a, b) =>
        Number(!isOpenCard(a)) - Number(!isOpenCard(b)) ||
        Date.parse(a.request.expiresAt) - Date.parse(b.request.expiresAt),
    ),
  );

  readonly loadState = this.load.asReadonly();

  /** Epoch milliseconds of the last successful load, or `null` before the first one. */
  readonly lastUpdated = this.updated.asReadonly();

  /** `true` when the last refresh failed and the list on screen is from an earlier load. */
  readonly refreshFailed = this.failed.asReadonly();

  /** Ids the first successful load returned, or `null` before it. Used by the deep link. */
  readonly firstLoadIds = this.firstIds.asReadonly();

  /** Number of requests the server confirmed on this page. A confirmed request becomes a session. */
  readonly acceptedCount = this.accepted.asReadonly();

  constructor() {
    merge(refreshTrigger(), this.manualRefresh)
      .pipe(
        // A trigger while a request is in flight is ignored.
        exhaustMap(() => this.fetch()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.ok) {
          this.apply(result.list);
        } else {
          void this.failRefresh(result.error);
        }
      });

    effect(() => this.expireDue(this.clock.now()));
  }

  accept(id: string): void {
    this.submit(id, 'accept');
  }

  decline(id: string): void {
    this.submit(id, 'decline');
  }

  /** Sends the kept action of a failed card again. */
  retryAnswer(id: string): void {
    const state = this.cardMap().get(id)?.state;
    if (state?.kind === 'failed') {
      this.submit(id, state.action);
    }
  }

  refresh(): void {
    this.manualRefresh.next();
  }

  /** Loads again after a failed first load, showing the loading state meanwhile. */
  retry(): void {
    if (this.load() === 'error') {
      this.load.set('loading');
    }
    this.refresh();
  }

  private fetch(): Observable<ListResult> {
    return this.api.getBookingRequests().pipe(
      map((list): ListResult => ({ ok: true, list })),
      catchError((error: unknown) => of<ListResult>({ ok: false, error: ApiError.from(error) })),
    );
  }

  private apply(list: BookingRequestList): void {
    this.clock.sync(list.serverTime);
    this.updated.set(this.clock.now());
    this.failed.set(false);
    this.load.set('ready');
    this.firstIds.update((ids) => ids ?? new Set(list.items.map((item) => item.id)));
    this.cardMap.update((cards) => mergeCards(cards, list.items));
  }

  private async failRefresh(error: ApiError): Promise<void> {
    if (isNotApproved(error) && (await leaveWhenNotApproved(this.auth, this.router))) {
      return;
    }
    if (this.updated() === null) {
      this.load.set('error');
    } else {
      this.failed.set(true);
    }
  }

  private submit(id: string, action: CardAction): void {
    const card = this.cardMap().get(id);
    if (!card) {
      return;
    }
    const started = startSubmit(card, action);
    if (started === card) {
      return;
    }
    this.setCard(started);

    const call = action === 'accept' ? this.api.acceptBooking(id) : this.api.declineBooking(id);
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (booking) => {
        this.updateCard(id, (current) => resolveSuccess(current, booking));
        if (action === 'accept') {
          this.accepted.update((count) => count + 1);
        }
      },
      error: (error: unknown) => void this.failAnswer(id, ApiError.from(error)),
    });
  }

  private async failAnswer(id: string, error: ApiError): Promise<void> {
    if (isNotApproved(error) && (await leaveWhenNotApproved(this.auth, this.router))) {
      return;
    }
    this.updateCard(id, (current) => resolveError(current, error.status, error.code));
    if (this.cardMap().get(id)?.state.kind === 'unavailable') {
      // The list on screen is out of date: fetch the real one once.
      this.refresh();
    }
  }

  /** At the deadline an idle card becomes `expired`, and the list is fetched once. */
  private expireDue(now: number): void {
    const cards = untracked(this.cardMap);
    let next: Map<string, RequestCard> | null = null;
    for (const [id, card] of cards) {
      if (card.state.kind === 'idle' && Date.parse(card.request.expiresAt) <= now) {
        next ??= new Map(cards);
        next.set(id, expireCard(card));
      }
    }
    if (next) {
      const expired = next;
      untracked(() => {
        this.cardMap.set(expired);
        this.refresh();
      });
    }
  }

  private setCard(card: RequestCard): void {
    this.cardMap.update((cards) => new Map(cards).set(card.request.id, card));
  }

  private updateCard(id: string, change: (card: RequestCard) => RequestCard): void {
    const card = this.cardMap().get(id);
    if (card) {
      this.setCard(change(card));
    }
  }
}

/**
 * Merges a poll into the card map. A card in `submitting` is left alone. An idle card the server no
 * longer lists is dropped. Resolved and failed cards stay, so the trainer sees how each one ended.
 */
function mergeCards(cards: ReadonlyMap<string, RequestCard>, items: BookingRequest[]): Map<string, RequestCard> {
  const incoming = new Map(items.map((item) => [item.id, item]));
  const next = new Map<string, RequestCard>();
  for (const [id, card] of cards) {
    const fresh = incoming.get(id);
    if (card.state.kind === 'submitting') {
      next.set(id, card);
    } else if (fresh) {
      next.set(id, { request: fresh, state: card.state });
    } else if (card.state.kind !== 'idle') {
      next.set(id, card);
    }
  }
  for (const item of items) {
    if (!next.has(item.id)) {
      next.set(item.id, { request: item, state: { kind: 'idle' } });
    }
  }
  return next;
}
