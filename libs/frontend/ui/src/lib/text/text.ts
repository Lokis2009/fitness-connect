import { Component, input } from '@angular/core';

export type FcTextVariant = 'body' | 'muted' | 'small';

/** Paragraph text with body, muted and small variants. */
@Component({
  selector: 'fc-text',
  template: '',
})
export class FcText {
  readonly variant = input<FcTextVariant>('body');
}
