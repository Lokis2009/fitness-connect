import { Component, input } from '@angular/core';

export type FcStateVariant = 'empty' | 'error' | 'info';

/** Panel for empty, error and notice messages. */
@Component({
  selector: 'fc-state',
  template: '',
})
export class FcState {
  readonly variant = input<FcStateVariant>('empty');
  readonly title = input('');

  constructor() {
    throw new Error('not implemented');
  }
}
