import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcSkeleton } from './skeleton';

@Component({
  imports: [FcSkeleton],
  template: `
    <fc-skeleton id="default" />
    <fc-skeleton id="bound" [lines]="lines()" [actions]="actions()" />
  `,
})
class Host {
  readonly lines = signal(3);
  readonly actions = signal(false);
}

describe('FcSkeleton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const skeleton = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    const lines = (id: string) => skeleton(id).querySelectorAll('[data-fc-skeleton-line]');
    const actions = (id: string) => skeleton(id).querySelectorAll('[data-fc-skeleton-action]');
    return { fixture, skeleton, lines, actions };
  }

  it('draws two text bars and no buttons by default', async () => {
    const { lines, actions } = await setup();

    expect(lines('default').length).toBe(2);
    expect(actions('default').length).toBe(0);
  });

  it('draws the requested number of text bars', async () => {
    const { fixture, lines } = await setup();

    expect(lines('bound').length).toBe(3);

    fixture.componentInstance.lines.set(5);
    await fixture.whenStable();

    expect(lines('bound').length).toBe(5);
  });

  it('adds two button bars when actions is set', async () => {
    const { fixture, actions } = await setup();

    fixture.componentInstance.actions.set(true);
    await fixture.whenStable();

    expect(actions('bound').length).toBe(2);
  });

  it('is a card-shaped box with bars drawn in the card line token', async () => {
    const { skeleton, lines } = await setup();
    const box = skeleton('default').firstElementChild as HTMLElement;

    expect(box.classList).toContain('rounded-card');
    expect(box.classList).toContain('border-line-card');
    expect(box.classList).toContain('bg-surface');
    expect(lines('default')[0].classList).toContain('bg-line-card');
  });

  it('hides the drawing from assistive technology and marks its container busy', async () => {
    const { skeleton } = await setup();

    expect(skeleton('default').getAttribute('aria-busy')).toBe('true');
    expect(skeleton('default').firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
