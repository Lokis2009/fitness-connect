import { Component, computed } from '@angular/core';

/** Small bordered pill for short labels. Projects its content. */
@Component({
  selector: 'fc-badge',
  template: '<span>{{ classes() }}<ng-content /></span>',
  host: { class: 'inline-block' },
})
export class FcBadge {
  protected readonly classes = computed((): string => {
    throw new Error('not implemented');
  });
}
