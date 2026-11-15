import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcScrollIntoView } from './scroll-into-view';

@Component({
  imports: [FcScrollIntoView],
  template: `<div id="target" [fcScrollIntoView]="active()">Target</div>`,
})
class Host {
  readonly active = signal(false);
}

describe('FcScrollIntoView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup(initial = false) {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.active.set(initial);
    await fixture.whenStable();
    const target = (fixture.nativeElement as HTMLElement).querySelector('#target') as HTMLElement;
    const update = async (value: boolean) => {
      fixture.componentInstance.active.set(value);
      await fixture.whenStable();
    };
    return { scroll, target, update };
  }

  it('does nothing while its input is false', async () => {
    const { scroll, target } = await setup();

    expect(scroll).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(target);
  });

  it('scrolls the host into view and focuses it when the input becomes true', async () => {
    const { scroll, target, update } = await setup();

    await update(true);

    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(target);
    expect(document.activeElement).toBe(target);
  });

  it('makes the host focusable without adding it to the tab order', async () => {
    const { target, update } = await setup();

    await update(true);

    expect(target.getAttribute('tabindex')).toBe('-1');
  });

  it('acts when the input is true from the start', async () => {
    const { scroll, target } = await setup(true);

    expect(scroll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(target);
  });

  it('does not scroll again when the input goes back to false', async () => {
    const { scroll, update } = await setup();

    await update(true);
    await update(false);

    expect(scroll).toHaveBeenCalledTimes(1);
  });
});
