import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcCard } from './card';

@Component({
  imports: [FcCard],
  template: `<fc-card><h2>Welcome</h2><p>Body text</p></fc-card>`,
})
class Host {}

describe('FcCard', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('projects all of its content', async () => {
    const card = (await render()).querySelector('fc-card') as HTMLElement;

    expect(card.querySelector('h2')?.textContent).toBe('Welcome');
    expect(card.querySelector('p')?.textContent).toBe('Body text');
  });

  it('is a padded, rounded surface built from the design tokens', async () => {
    const card = (await render()).querySelector('fc-card') as HTMLElement;

    expect(card.classList).toContain('block');
    expect(card.classList).toContain('bg-surface');
    expect(card.classList).toContain('text-on-surface');
    expect(card.classList).toContain('rounded-card');
    expect(card.classList).toContain('p-6');
  });
});
