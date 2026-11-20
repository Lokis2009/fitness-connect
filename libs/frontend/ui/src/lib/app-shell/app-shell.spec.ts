import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcAppShell } from './app-shell';
import { FcButton } from '../button/button';

@Component({
  imports: [FcAppShell, FcButton],
  template: `
    <fc-app-shell [brand]="brand()" [userLabel]="userLabel()">
      <fc-button slot="actions" (click)="signOuts.set(signOuts() + 1)">Sign out</fc-button>
      <p id="content">Page content</p>
    </fc-app-shell>
  `,
})
class Host {
  readonly brand = signal('fit-connect');
  readonly userLabel = signal('Alex Admin');
  readonly signOuts = signal(0);
}

@Component({
  imports: [FcAppShell],
  template: `<fc-app-shell><p id="content">Only content</p></fc-app-shell>`,
})
class DefaultsHost {}

describe('FcAppShell', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      root,
      header: () => root.querySelector('header') as HTMLElement,
      main: () => root.querySelector('main') as HTMLElement,
    };
  }

  it('has a banner header and a main landmark', async () => {
    const { root } = await setup();

    expect(root.querySelectorAll('header')).toHaveLength(1);
    expect(root.querySelectorAll('main')).toHaveLength(1);
  });

  it('shows the brand name in the header', async () => {
    const { fixture, header } = await setup();
    expect(header().textContent).toContain('fit-connect');

    fixture.componentInstance.brand.set('fit-connect admin');
    await fixture.whenStable();

    expect(header().textContent).toContain('fit-connect admin');
  });

  it('uses the brand font of the design tokens for the brand name', async () => {
    const { header } = await setup();

    expect((header().querySelector('[data-fc-brand]') as HTMLElement).classList).toContain('font-brand');
  });

  it('shows the user label in the header and updates it', async () => {
    const { fixture, header } = await setup();
    expect(header().querySelector('[data-fc-user]')?.textContent).toContain('Alex Admin');

    fixture.componentInstance.userLabel.set('Casey Client');
    await fixture.whenStable();

    expect(header().querySelector('[data-fc-user]')?.textContent).toContain('Casey Client');
  });

  it('omits the user label when there is none', async () => {
    const fixture = TestBed.createComponent(DefaultsHost);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-fc-user]')).toBeNull();
  });

  it('keeps the default brand name when none is given', async () => {
    const fixture = TestBed.createComponent(DefaultsHost);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('header')?.textContent).toContain('fit-connect');
  });

  it('projects the page content into main', async () => {
    const { main, header } = await setup();

    expect(main().querySelector('#content')?.textContent).toBe('Page content');
    expect(header().querySelector('#content')).toBeNull();
  });

  it('projects elements marked slot="actions" into the header, not into main', async () => {
    const { fixture, header, main } = await setup();
    const button = header().querySelector('fc-button') as HTMLElement;

    expect(button.textContent).toContain('Sign out');
    expect(main().querySelector('fc-button')).toBeNull();

    (button.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.signOuts()).toBe(1);
  });

  it('keeps long content inside the phone width instead of scrolling the page', async () => {
    const { header, main } = await setup();

    expect(header().classList).toContain('flex-wrap');
    expect(main().classList).toContain('min-w-0');
    expect((header().querySelector('[data-fc-user]') as HTMLElement).classList).toContain('truncate');
  });
});
