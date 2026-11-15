import { Component, computed, input } from '@angular/core';
import { FcBadge } from '../badge/badge';

/** "Respond by 14:30 (Warsaw)" with a badge for the time left. */
@Component({
  selector: 'fc-deadline',
  imports: [FcBadge],
  template: '<span>{{ label() }}</span>',
  host: { class: 'block' },
})
export class FcDeadline {
  readonly until = input.required<string>();
  /** Epoch milliseconds, server corrected by the caller. */
  readonly now = input.required<number>();
  readonly timeZone = input.required<string>();

  protected readonly label = computed((): string => {
    throw new Error('not implemented');
  });
}
