import { Component, input, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FcTextControl } from '../internal/text-control';

const VISIBILITY_ICON =
  'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const VISIBILITY_OFF_ICON =
  'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';

/**
 * Password control with a show/hide toggle. Implements the Signal Forms `FormValueControl`
 * contract, so it binds with `[formField]="form.password"`. Place it inside an `fc-form-field`.
 */
@Component({
  selector: 'fc-password-input',
  imports: [MatFormField, MatInput, MatIconButton, MatSuffix],
  template: `
    <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
      <input
        matInput
        [id]="controlId"
        [type]="visible() ? 'text' : 'password'"
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
      <button
        matIconButton
        matSuffix
        type="button"
        [disabled]="disabled()"
        [attr.aria-label]="toggleLabel()"
        [attr.aria-pressed]="visible()"
        (click)="toggleVisibility()"
      >
        <svg viewBox="0 0 24 24" class="size-6" fill="currentColor" aria-hidden="true" focusable="false">
          <path [attr.d]="visible() ? visibilityOffIcon : visibilityIcon" />
        </svg>
      </button>
    </mat-form-field>
  `,
  host: { class: 'block' },
})
export class FcPasswordInput extends FcTextControl {
  /** Accessible name of the toggle button. It stays the same; `aria-pressed` carries the state. */
  readonly toggleLabel = input('Show password');
  readonly visible = signal(false);

  override readonly autocomplete = input('current-password');

  protected readonly visibilityIcon = VISIBILITY_ICON;
  protected readonly visibilityOffIcon = VISIBILITY_OFF_ICON;

  toggleVisibility(): void {
    this.visible.update((visible) => !visible);
  }
}
