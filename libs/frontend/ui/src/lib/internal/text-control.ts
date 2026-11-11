import { Directive, computed, effect, inject, input, model, output, viewChild } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { FC_FORM_FIELD } from '../form-field/form-field';

let nextId = 0;

/**
 * Shared behaviour of the single-line text controls (`fc-text-input`, `fc-password-input`):
 * the Signal Forms `FormValueControl` contract and the wiring to a surrounding `fc-form-field`.
 * The subclass template must render one `<input matInput>` and bind `controlId`, `describedBy`,
 * `errorStateMatcher`, `onInput` and `touch` on it.
 */
@Directive()
export abstract class FcTextControl implements FormValueControl<string> {
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
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  /** Accessible name for use without an `fc-form-field` label. */
  readonly ariaLabel = input<string | null>(null);

  private readonly formField = inject(FC_FORM_FIELD, { optional: true });
  private readonly matInput = viewChild(MatInput);

  protected readonly controlId = this.formField?.controlId ?? `fc-text-control-${nextId++}`;
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
