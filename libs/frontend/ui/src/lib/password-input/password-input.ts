import { Component, input, signal } from '@angular/core';
import { FcTextControl } from '../internal/text-control';

/**
 * Password control with a show/hide toggle. Implements the Signal Forms `FormValueControl`
 * contract, so it binds with `[formField]="form.password"`. Place it inside an `fc-form-field`.
 */
@Component({
  selector: 'fc-password-input',
  template: '',
})
export class FcPasswordInput extends FcTextControl {
  /** Accessible name of the toggle button. It stays the same; `aria-pressed` carries the state. */
  readonly toggleLabel = input('Show password');
  readonly visible = signal(false);

  toggleVisibility(): void {
    throw new Error('not implemented');
  }
}
