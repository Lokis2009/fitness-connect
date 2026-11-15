import type { Observable } from 'rxjs';

/** How often the home page refetches its lists while the tab is visible. */
export const REFRESH_INTERVAL_MS = 30_000;

/**
 * Emits on start, when the tab becomes visible and every `REFRESH_INTERVAL_MS` while it is
 * visible. Each store subscribes to its own.
 */
export function refreshTrigger(): Observable<void> {
  throw new Error('not implemented');
}
