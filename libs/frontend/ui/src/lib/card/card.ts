import { Component } from '@angular/core';

/** Surface with padding and rounded corners that projects its content. */
@Component({
  selector: 'fc-card',
  template: '<ng-content />',
  host: { class: 'block w-full max-w-md rounded-card border border-line-card bg-surface p-6 text-ink' },
})
export class FcCard {}
