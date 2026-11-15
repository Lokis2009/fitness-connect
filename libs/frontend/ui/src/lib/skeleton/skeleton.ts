import { Component, computed, input } from '@angular/core';

/** Loading placeholder: grey bars inside a card-shaped box. The host is the busy container, the drawing is hidden from assistive technology. */
@Component({
  selector: 'fc-skeleton',
  template: `
    <div
      class="flex flex-col gap-form rounded-card border border-line-card bg-surface p-6 motion-safe:animate-pulse"
      aria-hidden="true"
    >
      <div class="flex flex-col gap-3">
        @for (line of bars(); track line) {
          <div
            data-fc-skeleton-line
            class="h-4 rounded-control bg-line-card"
            [class.w-full]="!$last"
            [class.w-2/3]="$last"
          ></div>
        }
      </div>
      @if (actions()) {
        <div class="flex gap-3">
          <div data-fc-skeleton-action class="h-control flex-1 rounded-control bg-line-card"></div>
          <div data-fc-skeleton-action class="h-control flex-1 rounded-control bg-line-card"></div>
        </div>
      }
    </div>
  `,
  host: { class: 'block', 'aria-busy': 'true' },
})
export class FcSkeleton {
  /** Number of text bars. */
  readonly lines = input(2);
  /** Adds two button bars under the text. */
  readonly actions = input(false);

  protected readonly bars = computed(() => Array.from({ length: Math.max(0, this.lines()) }, (_, i) => i));
}
