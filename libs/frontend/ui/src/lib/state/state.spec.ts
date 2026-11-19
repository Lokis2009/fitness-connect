import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcButton } from '../button/button';
import { FcState, FcStateVariant } from './state';

@Component({
  imports: [FcState, FcButton],
  template: `
    <fc-state id="empty" title="No requests waiting">New requests appear here.</fc-state>
    <fc-state id="error" variant="error" title="Could not load requests">
      Check your connection.
      <fc-button fcStateAction variant="text">Try again</fc-button>
    </fc-state>
    <fc-state id="info" variant="info" title="Ignored title">That request is no longer available.</fc-state>
    <fc-state id="bound" [variant]="variant()" title="Bound" />
  `,
})
class Host {
  readonly variant = signal<FcStateVariant>('empty');
}

describe('FcState', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const state = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    const panel = (id: string) => state(id).querySelector('[data-fc-state-panel]') as HTMLElement;
    const icon = (id: string) => state(id).querySelector('svg');
    const title = (id: string) => state(id).querySelector('[data-fc-state-title]');
    return { fixture, state, panel, icon, title };
  }

  it('is the empty variant by default and shows a bold title with the projected body', async () => {
    const { panel, title, icon } = await setup();

    expect(title('empty')?.textContent).toContain('No requests waiting');
    expect(panel('empty').textContent).toContain('New requests appear here.');
    expect(icon('empty')).toBeNull();
  });

  it('announces the error variant with role="alert" and shows an icon', async () => {
    const { panel, icon, title } = await setup();

    expect(panel('error').getAttribute('role')).toBe('alert');
    expect(icon('error')).not.toBeNull();
    expect(icon('error')?.getAttribute('aria-hidden')).toBe('true');
    expect(title('error')?.textContent).toContain('Could not load requests');
    expect(panel('error').classList).toContain('border-danger');
  });

  it('uses role="status" for empty and info', async () => {
    const { panel } = await setup();

    expect(panel('empty').getAttribute('role')).toBe('status');
    expect(panel('info').getAttribute('role')).toBe('status');
  });

  it('shows an icon but no title for the info variant', async () => {
    const { panel, icon, title } = await setup();

    expect(icon('info')).not.toBeNull();
    expect(title('info')).toBeNull();
    expect(panel('info').textContent).toContain('That request is no longer available.');
    expect(panel('info').classList).toContain('border-accent');
  });

  it('projects an action into the action slot', async () => {
    const { state } = await setup();

    const action = state('error').querySelector('[data-fc-state-action] fc-button');
    expect(action?.textContent).toContain('Try again');
    expect(state('empty').querySelector('[data-fc-state-action] fc-button')).toBeNull();
  });

  it('updates role and icon when the variant changes', async () => {
    const { fixture, panel, icon } = await setup();

    expect(panel('bound').getAttribute('role')).toBe('status');

    fixture.componentInstance.variant.set('error');
    await fixture.whenStable();

    expect(panel('bound').getAttribute('role')).toBe('alert');
    expect(icon('bound')).not.toBeNull();
  });
});
