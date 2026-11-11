import { Component, input } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FcTextControl } from '../internal/text-control';

export type FcTextInputType = 'text' | 'email' | 'tel' | 'search' | 'url';

/**
 * Single-line text control. Implements the Signal Forms `FormValueControl` contract, so it binds
 * with `[formField]="form.someField"`. Place it inside an `fc-form-field` for its label, hint and error.
 */
@Component({
  selector: 'fc-text-input',
  imports: [MatFormField, MatInput],
  template: `
    <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
      <input
        matInput
        [id]="controlId"
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [required]="required()"
        [errorStateMatcher]="errorStateMatcher"
        [aria-describedby]="describedBy()"
        [attr.aria-label]="ariaLabel()"
        [attr.autocomplete]="autocomplete()"
        [name]="name()"
        [attr.minlength]="minLength() ?? null"
        [attr.maxlength]="maxLength() ?? null"
        (input)="onInput($event)"
        (blur)="touch.emit()"
      />
    </mat-form-field>
  `,
  host: { class: 'block' },
})
export class FcTextInput extends FcTextControl {
  readonly type = input<FcTextInputType>('text');
}
