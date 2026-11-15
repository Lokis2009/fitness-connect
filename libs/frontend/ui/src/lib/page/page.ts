import { Component, computed, input } from '@angular/core';

export type FcPageAlign = 'center' | 'top';

const MAIN_CLASSES: Record<FcPageAlign, string> = {
  center: 'flex min-h-screen items-center justify-center bg-page p-4 text-ink',
  top: 'flex min-h-screen items-start justify-center bg-page px-form py-form text-ink',
};

const CONTENT_CLASSES: Record<FcPageAlign, string> = {
  center: 'contents',
  top: 'w-full max-w-column',
};

/**
 * Full-height page container. `center` (default) centers its content, as the login pages do.
 * `top` is for list pages: one content block at most `--container-column` wide, with 20 px side padding.
 */
@Component({
  selector: 'fc-page',
  template: `
    <main [class]="mainClasses()">
      <div data-fc-page-content [class]="contentClasses()"><ng-content /></div>
    </main>
  `,
  host: { class: 'block' },
})
export class FcPage {
  /** `center` centers the content (login pages), `top` lays out a list page. */
  readonly align = input<FcPageAlign>('center');

  protected readonly mainClasses = computed(() => MAIN_CLASSES[this.align()]);
  protected readonly contentClasses = computed(() => CONTENT_CLASSES[this.align()]);
}
