import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcBadge } from './badge';

@Component({
  imports: [FcBadge],
  template: '<fc-badge>37 min left</fc-badge>',
})
class Host {}

describe('FcBadge', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return { pill: root.querySelector('fc-badge span') as HTMLElement, root };
  }

  it('projects its content', async () => {
    const { pill } = await setup();

    expect(pill.textContent?.trim()).toBe('37 min left');
  });

  it('is a bordered pill built from tokens', async () => {
    const { pill } = await setup();

    expect(pill.classList).toContain('rounded-pill');
    expect(pill.classList).toContain('border');
    expect(pill.classList).toContain('border-line-input');
    expect(pill.classList).toContain('bg-surface');
  });

  it('uses the pill text step and no ad-hoc type classes', async () => {
    const { pill } = await setup();

    expect(pill.classList).toContain('text-pill');
    expect(pill.classList).toContain('text-ink');
    expect(Array.from(pill.classList).some((name) => /^(font-|leading-|text-\[)/.test(name))).toBe(false);
  });
});
