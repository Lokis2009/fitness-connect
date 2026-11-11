import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcHeading } from './heading';

@Component({
  imports: [FcHeading],
  template: `
    <fc-heading id="default">Default</fc-heading>
    <fc-heading id="bound" [level]="level()">Bound</fc-heading>
    <fc-heading id="attr" level="3">Attribute</fc-heading>
    <fc-heading id="invalid" [level]="9">Invalid</fc-heading>
  `,
})
class Host {
  readonly level = signal(2);
}

describe('FcHeading', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const heading = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    return { fixture, heading };
  }

  it('renders an h1 by default and projects the content', async () => {
    const { heading } = await setup();

    const h1 = heading('default').querySelector('h1');
    expect(h1?.textContent).toBe('Default');
    expect(h1?.classList).toContain('text-title');
    expect(h1?.classList).toContain('text-ink');
    expect(heading('default').querySelector('h2, h3')).toBeNull();
  });

  it('renders the heading element matching the level input', async () => {
    const { fixture, heading } = await setup();

    expect(heading('bound').querySelector('h2')?.textContent).toBe('Bound');
    expect(heading('bound').querySelector('h2')?.classList).toContain('text-heading');

    fixture.componentInstance.level.set(3);
    await fixture.whenStable();
    expect(heading('bound').querySelector('h3')?.textContent).toBe('Bound');
    expect(heading('bound').querySelector('h3')?.classList).toContain('text-subheading');
    expect(heading('bound').querySelector('h2')).toBeNull();

    fixture.componentInstance.level.set(1);
    await fixture.whenStable();
    expect(heading('bound').querySelector('h1')?.textContent).toBe('Bound');
  });

  it('accepts the level as a plain attribute', async () => {
    const { heading } = await setup();

    expect(heading('attr').querySelector('h3')?.textContent).toBe('Attribute');
  });

  it('falls back to level 1 for an unsupported level', async () => {
    const { heading } = await setup();

    expect(heading('invalid').querySelector('h1')?.textContent).toBe('Invalid');
  });
});
