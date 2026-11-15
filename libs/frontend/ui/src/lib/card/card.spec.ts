import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcCard, FcCardSize } from './card';

@Component({
  imports: [FcCard],
  template: `<fc-card><h2>Welcome</h2><p>Body text</p></fc-card>`,
})
class Host {}

@Component({
  imports: [FcCard],
  template: `<fc-card [highlighted]="highlighted()" [size]="size()">Body</fc-card>`,
})
class OptionsHost {
  readonly highlighted = signal(false);
  readonly size = signal<FcCardSize>('default');
}

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
    expect(card.classList).toContain('text-ink');
    expect(card.classList).toContain('rounded-card');
    expect(card.classList).toContain('p-6');
    expect(card.classList).toContain('border-line-card');
    expect(card.classList).not.toContain('shadow-md');
  });

  describe('options', () => {
    async function setup() {
      const fixture = TestBed.createComponent(OptionsHost);
      await fixture.whenStable();
      const card = (fixture.nativeElement as HTMLElement).querySelector('fc-card') as HTMLElement;
      const update = async (change: () => void) => {
        change();
        await fixture.whenStable();
      };
      return { host: fixture.componentInstance, card, update };
    }

    it('has the neutral border and the login-card width by default', async () => {
      const { card } = await setup();

      expect(card.classList).toContain('border-line-card');
      expect(card.classList).not.toContain('border-accent');
      expect(card.classList).toContain('max-w-md');
    });

    it('gets an accent border when highlighted', async () => {
      const { host, card, update } = await setup();

      await update(() => host.highlighted.set(true));

      expect(card.classList).toContain('border-accent');
      expect(card.classList).not.toContain('border-line-card');

      await update(() => host.highlighted.set(false));

      expect(card.classList).toContain('border-line-card');
      expect(card.classList).not.toContain('border-accent');
    });

    it('fills the width with size full', async () => {
      const { host, card, update } = await setup();

      await update(() => host.size.set('full'));

      expect(card.classList).not.toContain('max-w-md');
      expect(card.classList).toContain('w-full');
      expect(card.classList).toContain('rounded-card');
    });
  });
});
