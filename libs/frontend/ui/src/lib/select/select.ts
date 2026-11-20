import { Component, input, model, output } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

export interface FcSelectOption {
  /** An empty string is allowed, for example for an "All" choice. */
  readonly value: string;
  readonly label: string;
}

/**
 * Single-choice control on a native select. Implements the Signal Forms `FormValueControl`
 * contract, so it binds with `[formField]="form.someField"`. Place it inside an `fc-form-field`
 * for its label, hint and error.
 */
@Component({
  selector: 'fc-select',
  template: '',
})
export class FcSelect implements FormValueControl<string> {
  readonly options = input.required<readonly FcSelectOption[]>();

  // Signal Forms contract
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly name = input('');
  readonly touch = output<void>();

  /** Accessible name for use without an `fc-form-field` label. */
  readonly ariaLabel = input<string | null>(null);

  constructor() {
    throw new Error('not implemented');
  }

  focus(_options?: FocusOptions): void {
    throw new Error('not implemented');
  }
}
