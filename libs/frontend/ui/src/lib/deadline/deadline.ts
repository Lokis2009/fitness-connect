import { Component, computed, input } from '@angular/core';
import { FcBadge } from '../badge/badge';
import { formatClock, usableTimeZone } from '../time/zone-format';
import { zoneCity } from '../time/zone-city';

const MINUTE_MS = 60_000;

/**
 * "Respond by 14:30 (Warsaw)" followed by a badge with the time left.
 * Minutes round up. At or past the end time there is no badge: the owner shows its own "Expired".
 * It has no live region, so assistive technology is not interrupted every second.
 */
@Component({
  selector: 'fc-deadline',
  imports: [FcBadge],
  template: `
    <span class="text-body text-ink-muted">{{ label() }}</span>
    @if (timeLeft(); as left) {
      <fc-badge>{{ left }}</fc-badge>
    }
  `,
  host: { class: 'flex flex-wrap items-center gap-2' },
})
export class FcDeadline {
  /** The deadline, an ISO 8601 date-time. */
  readonly until = input.required<string>();
  /** Epoch milliseconds, server corrected by the caller. */
  readonly now = input.required<number>();
  /** IANA zone id of the venue. */
  readonly timeZone = input.required<string>();

  private readonly untilMs = computed(() => Date.parse(this.until()));

  /** UTC when the id is not a valid zone, so the page still renders. */
  private readonly zone = computed(() => usableTimeZone(this.timeZone()));

  protected readonly label = computed(
    () => `Respond by ${formatClock(this.untilMs(), this.zone())} (${zoneCity(this.zone())})`,
  );

  /** `null` once the deadline has been reached. */
  protected readonly timeLeft = computed((): string | null => {
    const remaining = this.untilMs() - this.now();
    if (remaining <= 0) {
      return null;
    }
    return remaining < MINUTE_MS ? 'less than 1 min left' : `${Math.ceil(remaining / MINUTE_MS)} min left`;
  });
}
