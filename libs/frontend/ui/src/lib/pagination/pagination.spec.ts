import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcPagination } from './pagination';

@Component({
  imports: [FcPagination],
  template: `
    <fc-pagination
      [total]="total()"
      [(page)]="page"
      [(pageSize)]="pageSize"
      [pageSizeOptions]="pageSizeOptions()"
      [label]="label()"
    />
  `,
})
class Host {
  readonly total = signal(120);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = signal<readonly number[]>([]);
  readonly label = signal('Users pagination');
}

describe('FcPagination', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const button = (name: 'next' | 'previous') =>
      root.querySelector(`button.mat-mdc-paginator-navigation-${name}`) as HTMLButtonElement;
    const click = async (name: 'next' | 'previous') => {
      button(name).click();
      await fixture.whenStable();
    };
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      button,
      click,
      range: () => root.querySelector('.mat-mdc-paginator-range-label')?.textContent?.trim(),
      update: async (fn: (host: Host) => void) => {
        fn(fixture.componentInstance);
        await fixture.whenStable();
      },
    };
  }

  it('is a labelled group of controls', async () => {
    const { root } = await setup();
    const group = root.querySelector('[role="group"]') as HTMLElement;

    expect(group.getAttribute('aria-label')).toBe('Users pagination');
  });

  it('shows the visible range and the total, counting pages from 1', async () => {
    const { range, update } = await setup();
    expect(range()).toBe('1 – 25 of 120');

    await update((host) => host.page.set(2));

    expect(range()).toBe('26 – 50 of 120');
  });

  it('shows the short last page', async () => {
    const { range, update } = await setup();

    await update((host) => host.page.set(5));

    expect(range()).toBe('101 – 120 of 120');
  });

  it('shows 0 of 0 when there are no items', async () => {
    const { range, update } = await setup();

    await update((host) => host.total.set(0));

    expect(range()).toBe('0 of 0');
  });

  it('moves to the next page and updates the page model', async () => {
    const { host, click } = await setup();

    await click('next');

    expect(host.page()).toBe(2);
  });

  it('moves back to the previous page', async () => {
    const { host, click, update } = await setup();
    await update((h) => h.page.set(3));

    await click('previous');

    expect(host.page()).toBe(2);
  });

  it('disables previous on the first page and next on the last page', async () => {
    const { button, update } = await setup();
    // Material keeps disabled buttons focusable (disabledInteractive) and marks them with aria-disabled.
    const isDisabled = (name: 'next' | 'previous') => button(name).getAttribute('aria-disabled') === 'true';
    expect(isDisabled('previous')).toBe(true);
    expect(isDisabled('next')).toBe(false);

    await update((host) => host.page.set(5));

    expect(isDisabled('previous')).toBe(false);
    expect(isDisabled('next')).toBe(true);
  });

  it('hides the page size selector when there are no size options', async () => {
    const { root } = await setup();

    expect(root.querySelector('.mat-mdc-paginator-page-size')).toBeNull();
  });

  it('shows the page size selector when size options are given', async () => {
    const { root, update } = await setup();

    await update((host) => host.pageSizeOptions.set([10, 25, 50]));

    expect(root.querySelector('.mat-mdc-paginator-page-size')).not.toBeNull();
  });

  it('reads the page size model', async () => {
    const { range, update } = await setup();

    await update((host) => host.pageSize.set(10));

    expect(range()).toBe('1 – 10 of 120');
  });

  it('returns to page 1 when the user picks another page size', async () => {
    const { fixture, host, root, update } = await setup();
    await update((h) => {
      h.pageSizeOptions.set([10, 25, 50]);
      h.page.set(3);
    });

    const select = root.querySelector('.mat-mdc-paginator-page-size mat-select') as HTMLElement;
    select.click();
    await fixture.whenStable();
    const option = Array.from(document.querySelectorAll('mat-option')).find((o) => o.textContent?.trim() === '50') as HTMLElement;
    option.click();
    await fixture.whenStable();

    expect(host.pageSize()).toBe(50);
    expect(host.page()).toBe(1);
  });
});
