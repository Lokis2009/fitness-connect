import { Directive, ElementRef, effect, inject, input } from '@angular/core';

/**
 * When its input becomes true, scrolls the host into view and focuses it.
 * The host gets `tabindex="-1"`: focusable by script, not part of the tab order.
 */
@Directive({
  selector: '[fcScrollIntoView]',
})
export class FcScrollIntoView {
  readonly fcScrollIntoView = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    effect(() => {
      if (!this.fcScrollIntoView()) return;
      this.host.setAttribute('tabindex', '-1');
      this.host.scrollIntoView({ block: 'center' });
      this.host.focus({ preventScroll: true });
    });
  }
}
