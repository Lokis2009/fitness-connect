/** A half-open range `[from, to)` of epoch milliseconds. */
export interface DayWindow {
  from: number;
  to: number;
}

/** A calendar date, with `month` from 1 to 12. */
interface LocalDate {
  year: number;
  month: number;
  day: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
/** Every zone is between UTC-12 and UTC+14, so local midnight is within 14 hours of UTC midnight. */
const SEARCH_RADIUS_MS = 14 * HOUR_MS;
/** Zone offsets and their changes are multiples of 15 minutes, so a coarse step cannot skip a day start. */
const COARSE_STEP_MS = 15 * MINUTE_MS;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    formatters.set(zone, formatter);
  }
  return formatter;
}

function localDate(instant: number, zone: string): LocalDate {
  const parts = formatterFor(zone).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

/** A number that orders calendar dates. */
function dateKey({ year, month, day }: LocalDate): number {
  return year * 10_000 + month * 100 + day;
}

/** The calendar date `days` after `date`. Pure calendar arithmetic, no zone involved. */
function addDays({ year, month, day }: LocalDate, days: number): LocalDate {
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
  };
}

/**
 * The earliest instant whose local date in `zone` is `date` or later. For a day without a local
 * 00:00 (a DST gap) this is the first instant that exists on that day.
 */
function startOfDay(date: LocalDate, zone: string): number {
  const target = dateKey(date);
  const utcMidnight = Date.UTC(date.year, date.month - 1, date.day);
  const first = utcMidnight - SEARCH_RADIUS_MS;
  const last = utcMidnight + SEARCH_RADIUS_MS;
  const reached = (instant: number): boolean => dateKey(localDate(instant, zone)) >= target;

  let coarse = first;
  while (coarse < last && !reached(coarse)) {
    coarse += COARSE_STEP_MS;
  }
  // `coarse` is the first quarter hour on the day. The start may be a few minutes earlier.
  let instant = Math.max(first, coarse - COARSE_STEP_MS + MINUTE_MS);
  while (instant < coarse && !reached(instant)) {
    instant += MINUTE_MS;
  }
  return instant;
}

/**
 * The window from the start of today to the end of tomorrow in `zone` (an IANA time zone),
 * for the instant `now` (epoch milliseconds).
 */
export function dayWindow(now: number, zone: string): DayWindow {
  const today = localDate(now, zone);
  return {
    from: startOfDay(today, zone),
    to: startOfDay(addDays(today, 2), zone),
  };
}

/** Which of the two listed days `startsAt` falls on in `zone`, or `null` for any other day. */
export function dayOf(
  startsAt: number,
  zone: string,
  now: number,
): 'today' | 'tomorrow' | null {
  const today = localDate(now, zone);
  const day = dateKey(localDate(startsAt, zone));
  if (day === dateKey(today)) {
    return 'today';
  }
  if (day === dateKey(addDays(today, 1))) {
    return 'tomorrow';
  }
  return null;
}

/** `true` when `startsAt` plus the duration is at or before `now`. */
export function hasEnded(
  startsAt: number,
  durationMinutes: number,
  now: number,
): boolean {
  return startsAt + durationMinutes * MINUTE_MS <= now;
}
