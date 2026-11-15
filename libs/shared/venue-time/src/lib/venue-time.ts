/** Offset of `zone` from UTC at the instant `at` (epoch milliseconds), in milliseconds. */
export function zoneOffsetMs(zone: string, at: number): number {
  throw new Error('not implemented');
}

/** The instant at which it is noon on the calendar day after `now` in `zone`. */
export function tomorrowNoon(zone: string, now: Date): Date {
  throw new Error('not implemented');
}
