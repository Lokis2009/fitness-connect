import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcStack } from './stack';

@Component({
  imports: [FcStack],
  template: '<fc-stack direction="horizontal" gap="lg"><span>child</span></fc-stack>',
})
class Host {}

describe('FcStack', () => {
  it('applies direction and gap classes and projects content', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement.querySelector('fc-stack');
    expect(el.classList.contains('flex-row')).toBe(true);
    expect(el.classList.contains('gap-6')).toBe(true);
    expect(el.textContent).toContain('child');
  });

  it('defaults to a vertical stack with medium gap', async () => {
    const fixture = TestBed.createComponent(FcStack);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.classList.contains('flex-col')).toBe(true);
    expect(el.classList.contains('gap-4')).toBe(true);
  });
});

@Component({
  imports: [FcStack],
  template: `
    <fc-stack direction="horizontal" justify="between" align="end"><span>a</span><span>b</span></fc-stack>
    <fc-stack justify="end" align="center"><span>c</span></fc-stack>
    <fc-stack justify="start" align="start"><span>d</span></fc-stack>
    <fc-stack align="stretch"><span>e</span></fc-stack>
  `,
})
class AlignHost {}

describe('FcStack alignment', () => {
  async function stacks(): Promise<HTMLElement[]> {
    const fixture = TestBed.createComponent(AlignHost);
    await fixture.whenStable();
    return Array.from(fixture.nativeElement.querySelectorAll('fc-stack'));
  }

  it('spreads children along the main axis with justify', async () => {
    const [between, end, start] = await stacks();

    expect(between.classList.contains('justify-between')).toBe(true);
    expect(end.classList.contains('justify-end')).toBe(true);
    expect(start.classList.contains('justify-start')).toBe(true);
  });

  it('aligns children across the main axis with align', async () => {
    const [between, end, start, stretch] = await stacks();

    expect(between.classList.contains('items-end')).toBe(true);
    expect(end.classList.contains('items-center')).toBe(true);
    expect(start.classList.contains('items-start')).toBe(true);
    expect(stretch.classList.contains('items-stretch')).toBe(true);
  });

  it('adds no justify or align class by default, so existing stacks keep their layout', async () => {
    const fixture = TestBed.createComponent(FcStack);
    await fixture.whenStable();

    const classes = Array.from((fixture.nativeElement as HTMLElement).classList);
    expect(classes.filter((name) => name.startsWith('justify-') || name.startsWith('items-'))).toEqual([]);
  });
});
