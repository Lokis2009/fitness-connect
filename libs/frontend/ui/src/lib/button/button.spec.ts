import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcButton } from './button';

@Component({
  imports: [FcButton],
  template: `
    <fc-button variant="secondary" type="submit" [disabled]="true">Book</fc-button>
    <fc-button>Default</fc-button>
  `,
})
class Host {}

describe('FcButton', () => {
  it('projects content and forwards type and disabled to the inner button', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const [first, second] = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('fc-button button'),
    );
    expect(first.textContent).toContain('Book');
    expect(first.type).toBe('submit');
    expect(first.disabled).toBe(true);
    expect(first.classList.contains('mat-mdc-outlined-button')).toBe(true);

    expect(second.type).toBe('button');
    expect(second.disabled).toBe(false);
    expect(second.classList.contains('mat-mdc-unelevated-button')).toBe(true);
  });
});

@Component({
  imports: [FcButton],
  template: `
    <fc-button
      type="submit"
      [loading]="loading()"
      [disabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
    >
      Sign in
    </fc-button>
  `,
})
class LoadingHost {
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly clicks = signal(0);
}

describe('FcButton loading', () => {
  async function setup() {
    const fixture = TestBed.createComponent(LoadingHost);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const update = async (change: () => void) => {
      change();
      await fixture.whenStable();
    };
    return {
      host: fixture.componentInstance,
      update,
      button: () => root.querySelector('button') as HTMLButtonElement,
      spinner: () => root.querySelector('mat-progress-spinner') as HTMLElement | null,
      label: () => root.querySelector('button [data-fc-label]') as HTMLElement,
    };
  }

  it('is idle by default: enabled, not busy, no spinner', async () => {
    const { button, spinner } = await setup();

    expect(button().disabled).toBe(false);
    expect(button().hasAttribute('aria-busy')).toBe(false);
    expect(spinner()).toBeNull();
  });

  it('disables the button, marks it busy and shows a spinner while loading', async () => {
    const { host, update, button, spinner } = await setup();

    await update(() => host.loading.set(true));

    expect(button().disabled).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(spinner()).not.toBeNull();
  });

  it('keeps the label in the layout and in the accessible name so the width does not change', async () => {
    const { host, update, button, spinner, label } = await setup();

    await update(() => host.loading.set(true));

    expect(button().textContent).toContain('Sign in');
    expect(label().classList).toContain('opacity-0');
    expect(spinner()?.classList).toContain('absolute');
  });

  it('hides the spinner from assistive technology', async () => {
    const { host, update, spinner } = await setup();

    await update(() => host.loading.set(true));

    expect(spinner()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('returns to normal when loading ends', async () => {
    const { host, update, button, spinner, label } = await setup();

    await update(() => host.loading.set(true));
    await update(() => host.loading.set(false));

    expect(button().disabled).toBe(false);
    expect(button().hasAttribute('aria-busy')).toBe(false);
    expect(spinner()).toBeNull();
    expect(label().classList).not.toContain('opacity-0');
  });

  it('stays disabled after loading when it was disabled by the caller', async () => {
    const { host, update, button } = await setup();

    await update(() => {
      host.disabled.set(true);
      host.loading.set(true);
    });
    await update(() => host.loading.set(false));

    expect(button().disabled).toBe(true);
  });

  it('does not report clicks while loading', async () => {
    const { host, update, button } = await setup();

    button().click();
    expect(host.clicks()).toBe(1);

    await update(() => host.loading.set(true));
    button().click();
    expect(host.clicks()).toBe(1);
  });
});
