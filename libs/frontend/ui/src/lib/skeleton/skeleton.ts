import { Component, input } from '@angular/core';

/** Loading placeholder: grey bars inside a card-shaped box. */
@Component({
  selector: 'fc-skeleton',
  template: '',
})
export class FcSkeleton {
  /** Number of text bars. */
  readonly lines = input(2);
  /** Adds two button bars under the text. */
  readonly actions = input(false);

  constructor() {
    throw new Error('not implemented');
  }
}
