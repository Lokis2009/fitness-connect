import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcAlert, FcAlertVariant } from './alert';

@Component({
  imports: [FcAlert],
  template: `
    <fc-alert id="default">Heads up</fc-alert>
    <fc-alert id="error" variant="error">This account is not a trainer.</fc-alert>
    <fc-alert id="bound" [variant]="variant()"><strong>Bound</strong> message</fc-alert>
  `,
})
class Host {
  readonly variant = signal<FcAlertVariant>('info');
}

describe('FcAlert', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const box = (id: string) => root.querySelector(`#${id} > div`) as HTMLElement;
    return { fixture, box };
  }

  it('projects its content, including markup', async () => {
    const { box } = await setup();

    expect(box('default').textContent).toContain('Heads up');
    expect(box('bound').querySelector('strong')?.textContent).toBe('Bound');
  });

  it('announces errors with role="alert"', async () => {
    const { box } = await setup();

    expect(box('error').getAttribute('role')).toBe('alert');
    expect(box('error').textContent).toContain('This account is not a trainer.');
  });

  it('uses the polite role="status" for info messages, which is the default variant', async () => {
    const { box } = await setup();

    expect(box('default').getAttribute('role')).toBe('status');
  });

  it('updates role and styling when the variant changes', async () => {
    const { fixture, box } = await setup();

    expect(box('bound').getAttribute('role')).toBe('status');
    expect(box('bound').classList).toContain('border-accent');

    fixture.componentInstance.variant.set('error');
    await fixture.whenStable();

    expect(box('bound').getAttribute('role')).toBe('alert');
    expect(box('bound').classList).toContain('border-danger');
    expect(box('bound').classList).not.toContain('border-accent');
  });
});
