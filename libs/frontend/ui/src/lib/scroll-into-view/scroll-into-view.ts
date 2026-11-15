import { Directive, input } from '@angular/core';

/** When its input becomes true, scrolls the host into view and focuses it. */
@Directive({
  selector: '[fcScrollIntoView]',
})
export class FcScrollIntoView {
  readonly fcScrollIntoView = input(false);

  constructor() {
    throw new Error('not implemented');
  }
}
