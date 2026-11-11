import { Component, input } from '@angular/core';

export type FcHeadingLevel = 1 | 2 | 3;

/** Heading that renders an h1, h2 or h3 depending on `level`. */
@Component({
  selector: 'fc-heading',
  template: '',
})
export class FcHeading {
  readonly level = input<FcHeadingLevel>(1);
}
