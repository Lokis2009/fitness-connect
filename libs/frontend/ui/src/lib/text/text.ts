import { Component, computed, input } from '@angular/core';

export type FcTextVariant = 'body' | 'muted' | 'small';

const VARIANT_CLASSES: Record<FcTextVariant, string> = {
  body: 'text-base text-on-surface',
  muted: 'text-base text-on-surface/70',
  small: 'text-sm text-on-surface/70',
};

/** Paragraph text with body, muted and small variants. */
@Component({
  selector: 'fc-text',
  template: '<p [class]="classes()"><ng-content /></p>',
  host: { class: 'block' },
})
export class FcText {
  readonly variant = input<FcTextVariant>('body');

  protected readonly classes = computed(() => VARIANT_CLASSES[this.variant()]);
}
