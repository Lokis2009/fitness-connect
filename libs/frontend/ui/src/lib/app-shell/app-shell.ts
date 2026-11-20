import { Component, input } from '@angular/core';

/**
 * Frame of a signed-in page: a header with the brand name, the user label and a slot for actions
 * such as sign out (`<fc-button slot="actions">`), and a content area for the page.
 */
@Component({
  selector: 'fc-app-shell',
  template: `
    <header
      class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-card bg-surface px-4 py-2"
    >
      <span data-fc-brand class="font-brand text-subheading text-ink">{{ brand() }}</span>
      <div class="flex min-w-0 items-center gap-4">
        @if (userLabel()) {
          <span data-fc-user class="min-w-0 truncate text-caption text-ink-muted">{{ userLabel() }}</span>
        }
        <ng-content select="[slot=actions]" />
      </div>
    </header>
    <main class="mx-auto w-full min-w-0 max-w-5xl flex-1 p-4">
      <ng-content />
    </main>
  `,
  host: { class: 'flex min-h-screen flex-col bg-page text-ink' },
})
export class FcAppShell {
  readonly brand = input('fit-connect');
  readonly userLabel = input('');
}
