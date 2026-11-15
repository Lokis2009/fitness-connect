import { Component, computed, input } from '@angular/core';
import { UI_LOCALE } from './zone-format';

export { UI_LOCALE };

export type FcTimeFormat = 'datetime' | 'day' | 'range';

/** Shows a UTC instant in an IANA zone, in a `<time>` element. */
@Component({
  selector: 'fc-time',
  template: '<time [attr.datetime]="value()">{{ text() }}</time>',
  host: { class: 'block' },
})
export class FcTime {
  readonly value = input.required<string>();
  readonly timeZone = input.required<string>();
  readonly format = input<FcTimeFormat>('datetime');
  readonly now = input<number | undefined>(undefined);
  readonly durationMinutes = input<number | undefined>(undefined);

  protected readonly text = computed((): string => {
    throw new Error('not implemented');
  });
}
