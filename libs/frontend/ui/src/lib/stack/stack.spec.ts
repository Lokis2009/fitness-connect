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
