/** The one interface language (D13). Every date and time in the library is formatted with it. */
export const UI_LOCALE = 'en-GB';

const formatters = new Map<string, Intl.DateTimeFormat>();
const validity = new Map<string, boolean>();

/**
 * Whether `zone` is a time zone id that `Intl` knows. Zones come from stored text, so a typo can
 * reach the browser, and `Intl` throws a RangeError for it.
 */
export function isValidTimeZone(zone: string): boolean {
  let known = validity.get(zone);
  if (known === undefined) {
    try {
      new Intl.DateTimeFormat(UI_LOCALE, { timeZone: zone });
      known = true;
    } catch {
      known = false;
    }
    validity.set(zone, known);
  }
  return known;
}

/** `zone` when it is valid, UTC otherwise, so that formatting never throws. */
export function usableTimeZone(zone: string): string {
  return isValidTimeZone(zone) ? zone : 'UTC';
}

function formatter(zone: string, kind: 'label' | 'numeric'): Intl.DateTimeFormat {
  const key = `${kind}|${zone}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached =
      kind === 'label'
        ? new Intl.DateTimeFormat(UI_LOCALE, {
            timeZone: zone,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          })
        : new Intl.DateTimeFormat(UI_LOCALE, { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric' });
    formatters.set(key, cached);
  }
  return cached;
}

function parts(epoch: number, zone: string, kind: 'label' | 'numeric'): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of formatter(zone, kind).formatToParts(new Date(epoch))) {
    result[part.type] = part.value;
  }
  return result;
}

/** The local calendar date of an instant, as a day number that can be subtracted. */
function localDayNumber(epoch: number, zone: string): number {
  const { year, month, day } = parts(epoch, zone, 'numeric');
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000;
}

/** Day offset of `epoch` from the local date of `now` in `zone`: 0 is today, 1 is tomorrow. */
export function dayOffset(epoch: number, now: number, zone: string): number {
  return localDayNumber(epoch, zone) - localDayNumber(now, zone);
}

/** Short local date such as "Tue 17 Nov". */
export function formatShortDate(epoch: number, zone: string): string {
  const { weekday, day, month } = parts(epoch, zone, 'label');
  return `${weekday} ${day} ${month}`;
}

/** 24-hour local clock such as "09:05". */
export function formatClock(epoch: number, zone: string): string {
  const { hour, minute } = parts(epoch, zone, 'label');
  return `${hour}:${minute}`;
}
