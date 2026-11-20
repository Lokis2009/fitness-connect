import { Component, input } from '@angular/core';

/**
 * Frame of a signed-in page: a header with the brand name, the user label and a slot for actions
 * such as sign out (`<fc-button slot="actions">`), and a content area for the page.
 */
@Component({
  selector: 'fc-app-shell',
  template: '',
})
export class FcAppShell {
  readonly brand = input('fit-connect');
  readonly userLabel = input('');

  constructor() {
    throw new Error('not implemented');
  }
}
