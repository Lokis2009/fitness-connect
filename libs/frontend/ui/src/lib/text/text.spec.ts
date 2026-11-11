import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcText, FcTextVariant } from './text';

@Component({
  imports: [FcText],
  template: `
    <fc-text id="default">Default copy</fc-text>
    <fc-text id="bound" [variant]="variant()">Bound copy</fc-text>
  `,
})
class Host {
  readonly variant = signal<FcTextVariant>('muted');
}

describe('FcText', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const paragraph = (id: string) => root.querySelector(`#${id} p`) as HTMLParagraphElement;
    return { fixture, paragraph };
  }

  it('renders a paragraph and projects the content', async () => {
    const { paragraph } = await setup();

    expect(paragraph('default')).not.toBeNull();
    expect(paragraph('default').textContent).toBe('Default copy');
  });

  it('uses the body style by default', async () => {
    const { paragraph } = await setup();

    expect(paragraph('default').classList).toContain('text-base');
    expect(paragraph('default').classList).toContain('text-on-surface');
  });

  it('switches style when the variant changes', async () => {
    const { fixture, paragraph } = await setup();

    expect(paragraph('bound').classList).toContain('text-on-surface/70');

    fixture.componentInstance.variant.set('small');
    await fixture.whenStable();
    expect(paragraph('bound').classList).toContain('text-sm');
    expect(paragraph('bound').classList).not.toContain('text-on-surface/70');

    fixture.componentInstance.variant.set('body');
    await fixture.whenStable();
    expect(paragraph('bound').classList).toContain('text-base');
  });
});
