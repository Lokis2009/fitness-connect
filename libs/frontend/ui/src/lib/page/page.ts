import { Component } from '@angular/core';

/** Full-height page container that centers its content. */
@Component({
  selector: 'fc-page',
  template: `
    <main class="flex min-h-screen items-center justify-center bg-page p-4 text-ink">
      <ng-content />
    </main>
  `,
  host: { class: 'block' },
})
export class FcPage {}
