import { Component, computed, input } from '@angular/core';

export type FcStateVariant = 'empty' | 'error' | 'info';

const VARIANT_CLASSES: Record<FcStateVariant, string> = {
  empty: 'border-line-card bg-surface text-ink-muted',
  error: 'border-danger bg-danger/10 text-ink',
  info: 'border-accent bg-accent/10 text-ink',
};

/**
 * Panel for empty, error and notice messages. Projects the body and, with `fcStateAction`, an action.
 * The title is not shown for the `info` variant.
 */
@Component({
  selector: 'fc-state',
  template: `
    <div
      data-fc-state-panel
      class="flex gap-3 rounded-card border p-6 text-body"
      [class]="classes()"
      [attr.role]="role()"
    >
      @if (variant() === 'error') {
        <svg class="mt-0.5 size-6 shrink-0 text-danger" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          />
        </svg>
      } @else if (variant() === 'info') {
        <svg class="mt-0.5 size-6 shrink-0 text-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
          />
        </svg>
      }
      <div class="flex min-w-0 flex-col gap-2">
        @if (variant() !== 'info' && title()) {
          <p data-fc-state-title class="text-subheading text-ink">{{ title() }}</p>
        }
        <div><ng-content /></div>
        <div data-fc-state-action class="empty:hidden"><ng-content select="[fcStateAction]" /></div>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class FcState {
  readonly variant = input<FcStateVariant>('empty');
  readonly title = input('');

  /** Errors interrupt assistive technology (`alert`), the others wait their turn (`status`). */
  protected readonly role = computed(() => (this.variant() === 'error' ? 'alert' : 'status'));
  protected readonly classes = computed(() => VARIANT_CLASSES[this.variant()]);
}
