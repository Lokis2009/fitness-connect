import { Component, computed, effect, inject, input, model, output, viewChild } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FC_FORM_FIELD } from '../form-field/form-field';

let nextId = 0;

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

  private readonly formField = inject(FC_FORM_FIELD, { optional: true });
  private readonly matInput = viewChild(MatInput);

  protected readonly controlId = this.formField?.controlId ?? `fc-text-input-${nextId++}`;
  protected readonly describedBy = computed(() => this.formField?.describedBy() ?? '');
  private readonly showInvalid = computed(() => this.formField?.invalid() ?? false);

  /** Material only evaluates this for its own form controls, so `updateErrorState()` is called below. */
  protected readonly errorStateMatcher: ErrorStateMatcher = { isErrorState: () => this.showInvalid() };

  constructor() {
    effect(() => {
      this.showInvalid();
      this.matInput()?.updateErrorState();
    });
  }

  focus(options?: FocusOptions): void {
    this.matInput()?.focus(options);
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
