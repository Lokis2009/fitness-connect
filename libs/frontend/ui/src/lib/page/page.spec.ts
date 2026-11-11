import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcPage } from './page';

@Component({
  imports: [FcPage],
  template: `<fc-page><p>Sign in</p></fc-page>`,
})
class Host {}

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
    expect(main.classList).toContain('items-center');
    expect(main.classList).toContain('justify-center');
  });
});
