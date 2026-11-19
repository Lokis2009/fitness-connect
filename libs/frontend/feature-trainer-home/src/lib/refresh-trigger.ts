import {
  EMPTY,
  type Observable,
  concat,
  defer,
  distinctUntilChanged,
  fromEvent,
  interval,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

/** How often the home page refetches its lists while the tab is visible. */
export const REFRESH_INTERVAL_MS = 30_000;

function isVisible(): boolean {
  return document.visibilityState === 'visible';
}

/**
 * Emits on start, when the tab becomes visible and every `REFRESH_INTERVAL_MS` while it is
 * visible. Each store subscribes to its own.
 */
export function refreshTrigger(): Observable<void> {
  return defer(() => {
    const startsVisible = isVisible();
    const ticks = fromEvent(document, 'visibilitychange').pipe(
      map(isVisible),
      startWith(startsVisible),
      distinctUntilChanged(),
      // A visible tab emits now and then on every interval. A hidden one emits nothing.
      switchMap((visible) =>
        visible ? interval(REFRESH_INTERVAL_MS).pipe(startWith(0)) : EMPTY,
      ),
      map((): void => undefined),
    );
    // A tab that starts hidden still loads once, then waits until it is visible.
    return startsVisible ? ticks : concat(of(undefined), ticks);
  });
}
