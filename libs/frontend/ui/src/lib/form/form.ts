import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

/**
 * Wraps a Signal Forms field tree in a native form: Enter submits, validation is left to the
 * field tree (`novalidate`), and the tree's own `submission` options run on submit.
 */
@Component({
  selector: 'fc-form',
  template: '',
})
export class FcForm<T> {
  /** The root field tree created with `form()`; configure `submission` there. */
  readonly form = input.required<FieldTree<T>>();

  constructor() {
    throw new Error('not implemented');
  }
}
