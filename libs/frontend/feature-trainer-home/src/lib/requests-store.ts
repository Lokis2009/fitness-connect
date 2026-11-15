import { type Signal, Service } from '@angular/core';
import type { RequestCard } from './request-card-state';

/** Load state of a list: first load, loaded, or failed with no earlier data. */
export type LoadState = 'loading' | 'ready' | 'error';

/**
 * Pending requests of the trainer: the map of cards, accept and decline, and polling. Provided in
 * `TrainerHome`'s `providers`, so it lives until the page is left.
 */
@Service({ autoProvided: false })
export class RequestsStore {
  get cards(): Signal<RequestCard[]> {
    throw new Error('not implemented');
  }

  get loadState(): Signal<LoadState> {
    throw new Error('not implemented');
  }

  /** Epoch milliseconds of the last successful load, or `null` before the first one. */
  get lastUpdated(): Signal<number | null> {
    throw new Error('not implemented');
  }

  /** `true` when the last refresh failed and the list on screen is from an earlier load. */
  get refreshFailed(): Signal<boolean> {
    throw new Error('not implemented');
  }

  /** Ids the first successful load returned, or `null` before it. Used by the deep link. */
  get firstLoadIds(): Signal<ReadonlySet<string> | null> {
    throw new Error('not implemented');
  }

  accept(id: string): void {
    void id;
    throw new Error('not implemented');
  }

  decline(id: string): void {
    void id;
    throw new Error('not implemented');
  }

  /** Sends the kept action of a failed card again. */
  retryAnswer(id: string): void {
    void id;
    throw new Error('not implemented');
  }

  refresh(): void {
    throw new Error('not implemented');
  }

  retry(): void {
    throw new Error('not implemented');
  }
}
