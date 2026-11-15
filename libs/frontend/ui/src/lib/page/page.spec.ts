import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FcPage, FcPageAlign } from './page';

const tokens = readFileSync(join(import.meta.dirname, '../../styles/tokens.css'), 'utf8');

@Component({
  imports: [FcPage],
  template: `<fc-page><p>Sign in</p></fc-page>`,
})
class Host {}

@Component({
  imports: [FcPage],
  template: `<fc-page [align]="align()"><p>List</p></fc-page>`,
})
class AlignHost {
  readonly align = signal<FcPageAlign>('top');
}

describe('FcPage', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('projects its content inside a main landmark', async () => {
    const root = await render();

    const main = root.querySelector('fc-page main');
    expect(main).not.toBeNull();
    expect(main?.textContent).toContain('Sign in');
  });

  it('fills the viewport height and centers the content', async () => {
    const root = await render();
    const main = root.querySelector('fc-page main') as HTMLElement;

    expect(main.classList).toContain('min-h-screen');
    expect(main.classList).toContain('bg-page');
    expect(main.classList).toContain('text-ink');
    expect(main.classList).toContain('items-center');
    expect(main.classList).toContain('justify-center');
  });

  describe('align', () => {
    async function setup() {
      const fixture = TestBed.createComponent(AlignHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const update = async (align: FcPageAlign) => {
        fixture.componentInstance.align.set(align);
        await fixture.whenStable();
      };
      return {
        update,
        main: () => root.querySelector('fc-page main') as HTMLElement,
        block: () => root.querySelector('fc-page [data-fc-page-content]') as HTMLElement,
      };
    }

    it('top starts at the top and does not center vertically', async () => {
      const { main } = await setup();

      expect(main().classList).toContain('min-h-screen');
      expect(main().classList).toContain('bg-page');
      expect(main().classList).not.toContain('items-center');
      expect(main().classList).toContain('items-start');
    });

    it('top centers one content block no wider than the column token, with 20 px side padding', async () => {
      const { main, block } = await setup();

      expect(main().classList).toContain('justify-center');
      expect(main().classList).toContain('px-form');
      expect(block().classList).toContain('w-full');
      expect(block().classList).toContain('max-w-column');
      expect(block().textContent).toContain('List');
    });

    it('goes back to centering when align changes to center', async () => {
      const { update, main, block } = await setup();

      await update('center');

      expect(main().classList).toContain('items-center');
      expect(main().classList).not.toContain('items-start');
      expect(block().classList).not.toContain('max-w-column');
    });

    it('reads the column width from the --container-column token, 60rem (960 px)', () => {
      expect(tokens).toMatch(/--container-column:\s*60rem;/);
    });
  });
});
