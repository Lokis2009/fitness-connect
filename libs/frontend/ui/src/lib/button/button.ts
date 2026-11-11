import { Component, computed, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export type FcButtonVariant = 'primary' | 'secondary' | 'text';
export type FcButtonType = 'button' | 'submit' | 'reset';

const APPEARANCE = {
  primary: 'filled',
  secondary: 'outlined',
  text: 'text',
} as const;

@Component({
  selector: 'fc-button',
  imports: [MatButton, MatProgressSpinner],
  template: `
    <button
      [matButton]="appearance()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? 'true' : null"
    >
      <span class="relative inline-flex items-center justify-center">
        <span data-fc-label [class.opacity-0]="loading()"><ng-content /></span>
        @if (loading()) {
          <mat-progress-spinner
            class="absolute [--mat-progress-spinner-active-indicator-color:currentColor]"
            mode="indeterminate"
            aria-hidden="true"
            [diameter]="20"
          />
        }
      </span>
    </button>
  `,
  host: { class: 'inline-flex' },
})
export class FcButton {
  readonly variant = input<FcButtonVariant>('primary');
  readonly type = input<FcButtonType>('button');
  readonly disabled = input(false);
  /** While true the button is disabled, shows a spinner, is marked busy and keeps its width. */
  readonly loading = input(false);

  protected readonly appearance = computed(() => APPEARANCE[this.variant()]);
}
