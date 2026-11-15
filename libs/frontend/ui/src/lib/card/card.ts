import { Component, computed, input } from '@angular/core';

export type FcCardSize = 'default' | 'full';

/** Surface with padding and rounded corners that projects its content. */
@Component({
  selector: 'fc-card',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class FcCard {
  /** Accent border, for the deep-linked card. */
  readonly highlighted = input(false);
  /** `default` keeps the login-card width, `full` fills the width. */
  readonly size = input<FcCardSize>('default');

  protected readonly classes = computed(
    () =>
      `block w-full ${this.size() === 'full' ? '' : 'max-w-md'} rounded-card border ${
        this.highlighted() ? 'border-accent ring-1 ring-accent' : 'border-line-card'
      } bg-surface p-6 text-ink`,
  );
}
