import { Component } from '@angular/core';

/** Small bordered pill for short labels such as "Accepted" or "37 min left". Projects its content. */
@Component({
  selector: 'fc-badge',
  template: `
    <span
      class="inline-flex items-center rounded-pill border border-line-input bg-surface px-3 py-1 text-pill text-ink"
    >
      <ng-content />
    </span>
  `,
  host: { class: 'inline-block' },
})
export class FcBadge {}
