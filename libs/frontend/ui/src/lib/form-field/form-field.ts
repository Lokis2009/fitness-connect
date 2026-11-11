import { Component, InjectionToken, Signal, computed, forwardRef, input } from '@angular/core';

/**
 * What a form control needs from the `fc-form-field` that wraps it. Controls inject
 * {@link FC_FORM_FIELD} (optional) and apply these values to their native element.
 */
export interface FcFormFieldContext {
  /** Id the control must set on its native element so the label's `for` points at it. */
  readonly controlId: string;
  /** Space separated ids of the hint and error text, or null when there are none. */
  readonly describedBy: Signal<string | null>;
  /** True while an error message is shown; controls reflect it as `aria-invalid`. */
  readonly invalid: Signal<boolean>;
}

export const FC_FORM_FIELD = new InjectionToken<FcFormFieldContext>('FC_FORM_FIELD');

let nextId = 0;

/** Label, hint and error text around a projected control, wired together for assistive technology. */
@Component({
  selector: 'fc-form-field',
  template: `
    <label class="mb-1 block text-sm font-medium text-on-surface" [attr.for]="controlId">{{ label() }}</label>
    <ng-content />
    @if (hint()) {
      <p class="mt-1 text-sm text-on-surface/70" data-fc-hint [id]="hintId">{{ hint() }}</p>
    }
    <div aria-live="polite">
      @if (error()) {
        <p class="mt-1 text-sm text-danger" data-fc-error [id]="errorId">{{ error() }}</p>
      }
    </div>
  `,
  host: { class: 'block' },
  providers: [{ provide: FC_FORM_FIELD, useExisting: forwardRef(() => FcFormField) }],
})
export class FcFormField implements FcFormFieldContext {
  readonly label = input.required<string>();
  readonly hint = input<string | null | undefined>('');
  readonly error = input<string | null | undefined>('');

  private readonly uid = `fc-form-field-${nextId++}`;
  readonly controlId = `${this.uid}-control`;
  protected readonly hintId = `${this.uid}-hint`;
  protected readonly errorId = `${this.uid}-error`;

  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() => {
    const ids = [this.hint() ? this.hintId : null, this.invalid() ? this.errorId : null].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : null;
  });
}
