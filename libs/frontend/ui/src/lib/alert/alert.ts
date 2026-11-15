import { Component, computed, input } from '@angular/core';

export type FcAlertVariant = 'error' | 'info';

const VARIANT_CLASSES: Record<FcAlertVariant, string> = {
  error: 'border-danger bg-danger/10 text-danger',
  info: 'border-accent bg-accent/10 text-ink',
};

/** Message box for errors and information that projects its content. */
@Component({
  selector: 'fc-alert',
  template: `
    <div class="rounded-card border-l-4 px-4 py-3 text-caption" [class]="classes()" [attr.role]="role()">
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class FcAlert {
  readonly variant = input<FcAlertVariant>('info');

  /** Errors interrupt assistive technology (`alert`), info messages wait their turn (`status`). */
  protected readonly role = computed(() => (this.variant() === 'error' ? 'alert' : 'status'));
  protected readonly classes = computed(() => VARIANT_CLASSES[this.variant()]);
}
