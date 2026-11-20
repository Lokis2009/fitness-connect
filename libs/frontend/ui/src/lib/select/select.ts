import { Component, computed, effect, inject, input, model, output, viewChild } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FC_FORM_FIELD } from '../form-field/form-field';

export interface FcSelectOption {
  /** An empty string is allowed, for example for an "All" choice. */
  readonly value: string;
  readonly label: string;
}

let nextId = 0;

/**
 * Single-choice control on a native select, so phones show their own picker. Implements the Signal
 * Forms `FormValueControl` contract, so it binds with `[formField]="form.someField"`. Place it inside
 * an `fc-form-field` for its label, hint and error. A native select has no read-only mode, so a
 * read-only field is shown disabled and marked `aria-readonly`.
 */
@Component({
  selector: 'fc-select',
  imports: [MatFormField, MatInput],
  template: `
    <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
      <select
        matNativeControl
        [id]="controlId"
        [disabled]="disabled() || readonly()"
        [required]="required()"
        [errorStateMatcher]="errorStateMatcher"
        [aria-describedby]="describedBy()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [name]="name()"
        (change)="onChange($event)"
        (blur)="touch.emit()"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </mat-form-field>
  `,
  host: { class: 'block' },
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

  private readonly formField = inject(FC_FORM_FIELD, { optional: true });
  private readonly matInput = viewChild(MatInput);

  protected readonly controlId = this.formField?.controlId ?? `fc-select-${nextId++}`;
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

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
