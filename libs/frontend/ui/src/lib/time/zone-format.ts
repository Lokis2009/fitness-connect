/** The one interface language (D13). Every date and time in the library is formatted with it. */
export const UI_LOCALE = 'en-GB';

/** Day offset of `epoch` from the local date of `now` in `zone`: 0 is today, 1 is tomorrow. */
export function dayOffset(epoch: number, now: number, zone: string): number {
  void [epoch, now, zone];
  throw new Error('not implemented');
}

/** Short local date such as "Tue 17 Nov". */
export function formatShortDate(epoch: number, zone: string): string {
  void [epoch, zone];
  throw new Error('not implemented');
}

/** 24-hour local clock such as "09:05". */
export function formatClock(epoch: number, zone: string): string {
  void [epoch, zone];
  throw new Error('not implemented');
}
