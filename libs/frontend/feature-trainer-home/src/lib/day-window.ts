/** A half-open range `[from, to)` of epoch milliseconds. */
export interface DayWindow {
  from: number;
  to: number;
}

/**
 * The window from the start of today to the end of tomorrow in `zone` (an IANA time zone),
 * for the instant `now` (epoch milliseconds).
 */
export function dayWindow(now: number, zone: string): DayWindow {
  void now;
  void zone;
  throw new Error('not implemented');
}

/** Which of the two listed days `startsAt` falls on in `zone`, or `null` for any other day. */
export function dayOf(
  startsAt: number,
  zone: string,
  now: number,
): 'today' | 'tomorrow' | null {
  void startsAt;
  void zone;
  void now;
  throw new Error('not implemented');
}

/** `true` when `startsAt` plus the duration is at or before `now`. */
export function hasEnded(
  startsAt: number,
  durationMinutes: number,
  now: number,
): boolean {
  void startsAt;
  void durationMinutes;
  void now;
  throw new Error('not implemented');
}
