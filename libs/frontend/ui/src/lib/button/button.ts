import { Component, computed, input } from '@angular/core';
import { MatButton } from '@angular/material/button';

export type FcButtonVariant = 'primary' | 'secondary' | 'text';
export type FcButtonType = 'button' | 'submit' | 'reset';

const APPEARANCE = {
  primary: 'filled',
  secondary: 'outlined',
  text: 'text',
} as const;

@Component({
  selector: 'fc-button',
  imports: [MatButton],
  template: `
    <button [matButton]="appearance()" [type]="type()" [disabled]="disabled()">
      <ng-content />
    </button>
  `,
  host: { class: 'inline-flex' },
})
export class FcButton {
  readonly variant = input<FcButtonVariant>('primary');
  readonly type = input<FcButtonType>('button');
  readonly disabled = input(false);

  protected readonly appearance = computed(() => APPEARANCE[this.variant()]);
}
