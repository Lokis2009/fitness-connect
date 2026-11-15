/** Offset of `zone` from UTC at the instant `at` (epoch milliseconds), in milliseconds. */
export function zoneOffsetMs(zone: string, at: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(at));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** The instant at which it is noon on the calendar day after `now` in `zone`. Noon is never inside a DST gap. */
export function tomorrowNoon(zone: string, now: Date): Date {
  const local = new Date(now.getTime() + zoneOffsetMs(zone, now.getTime()));
  const wallClock = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1, 12);
  // The offset is read near the answer, so a daylight saving change in between is handled.
  const approximate = wallClock - zoneOffsetMs(zone, wallClock);
  return new Date(wallClock - zoneOffsetMs(zone, approximate));
}
