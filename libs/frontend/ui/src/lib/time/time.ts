import { Component, computed, input } from '@angular/core';
import { UI_LOCALE, dayOffset, formatClock, formatShortDate } from './zone-format';
import { zoneCity } from './zone-city';

export { UI_LOCALE };

export type FcTimeFormat = 'datetime' | 'day' | 'range';

const MINUTE_MS = 60_000;

/**
 * Shows a UTC instant in an IANA zone, in a `<time datetime>` element.
 *
 * - `datetime`: "Tue 17 Nov, 10:00 Warsaw time", or "Today, 16:00 Warsaw time" when `now` is set.
 * - `day`: "Today, Sun 15 Nov" or "Tomorrow, Mon 16 Nov" (the plain date without `now`).
 * - `range`: "17:30–18:30" with "Warsaw time" under it (needs `durationMinutes`).
 *
 * Angular's DatePipe takes no IANA zone, so this uses Intl.DateTimeFormat with the fixed `en-GB` locale.
 */
@Component({
  selector: 'fc-time',
  template: `
    <time [class]="timeClasses()" [attr.datetime]="value()">{{ text() }}</time>
    @if (format() === 'range') {
      <span class="block text-caption text-ink-muted">{{ zoneLabel() }}</span>
    }
  `,
  host: { class: 'block' },
})
export class FcTime {
  /** The instant, an ISO 8601 date-time. */
  readonly value = input.required<string>();
  /** IANA zone id, for example `Europe/Warsaw`. */
  readonly timeZone = input.required<string>();
  readonly format = input<FcTimeFormat>('datetime');
  /** Epoch milliseconds. Enables the "Today" and "Tomorrow" forms. */
  readonly now = input<number | undefined>(undefined);
  /** Session length for the `range` format. */
  readonly durationMinutes = input<number | undefined>(undefined);

  protected readonly zoneLabel = computed(() => `${zoneCity(this.timeZone())} time`);

  /** `day` inherits the type of the heading it sits in. The other two are emphasised (600 weight). */
  protected readonly timeClasses = computed(() => (this.format() === 'day' ? '' : 'block text-button text-ink'));

  protected readonly text = computed((): string => {
    const epoch = Date.parse(this.value());
    const zone = this.timeZone();
    const now = this.now();
    const offset = now === undefined ? null : dayOffset(epoch, now, zone);
    const dayWord = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : null;

    switch (this.format()) {
      case 'range': {
        const start = formatClock(epoch, zone);
        const duration = this.durationMinutes();
        return duration === undefined ? start : `${start}–${formatClock(epoch + duration * MINUTE_MS, zone)}`;
      }
      case 'day': {
        const date = formatShortDate(epoch, zone);
        return dayWord ? `${dayWord}, ${date}` : date;
      }
      default: {
        const day = dayWord ?? formatShortDate(epoch, zone);
        return `${day}, ${formatClock(epoch, zone)} ${this.zoneLabel()}`;
      }
    }
  });
}
