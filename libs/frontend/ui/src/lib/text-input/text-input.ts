import { Component, input, model, output } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

export type FcTextInputType = 'text' | 'email' | 'tel' | 'search' | 'url';

/**
 * Single-line text control. Implements the Signal Forms `FormValueControl` contract, so it binds
 * with `[formField]="form.someField"`. Place it inside an `fc-form-field` for its label, hint and error.
 */
@Component({
  selector: 'fc-text-input',
  template: '',
})
export class FcTextInput implements FormValueControl<string> {
  // Signal Forms contract
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly name = input('');
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly touch = output<void>();

  // Presentation
  readonly type = input<FcTextInputType>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  /** Accessible name for use without an `fc-form-field` label. */
  readonly ariaLabel = input<string | null>(null);

  focus(options?: FocusOptions): void {
    throw new Error(`not implemented: ${JSON.stringify(options)}`);
  }
}
