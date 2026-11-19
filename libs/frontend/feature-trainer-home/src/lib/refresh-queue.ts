import { type Observable, Subject, concatMap, defer, filter, finalize, merge, tap } from 'rxjs';

/**
 * The refresh rules of a list store. Polls and manual refreshes are dropped while a request is
 * running or waiting. A refresh that follows a change on the server is queued instead, because
 * the request in flight may predate the change.
 */
export class RefreshQueue<T> {
  private readonly manual = new Subject<void>();
  private readonly queued = new Subject<void>();
  /** Requests running or waiting. */
  private busy = 0;

  /** One result for each request that ran, in order. */
  readonly results: Observable<T>;

  constructor(polls: Observable<unknown>, run: () => Observable<T>) {
    this.results = merge(
      merge(polls, this.manual).pipe(filter(() => this.busy === 0)),
      this.queued,
    ).pipe(
      tap(() => this.busy++),
      // defer turns a synchronous throw of `run` into an error of the inner stream, so `busy`
      // is always released by finalize.
      concatMap(() => defer(run).pipe(finalize(() => this.busy--))),
    );
  }

  /** Fetches now. Dropped while a request is in flight or waiting. */
  refresh(): void {
    this.manual.next();
  }

  /** Fetches after the request in flight, if any. Never dropped. */
  refreshAfterInFlight(): void {
    this.queued.next();
  }
}
