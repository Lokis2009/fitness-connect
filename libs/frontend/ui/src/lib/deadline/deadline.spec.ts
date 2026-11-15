import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcDeadline } from './deadline';

const UNTIL = '2026-11-17T13:30:00Z'; // 14:30 in Warsaw
const UNTIL_MS = Date.parse(UNTIL);
const MINUTE = 60_000;

@Component({
  imports: [FcDeadline],
  template: '<fc-deadline [until]="until()" [now]="now()" [timeZone]="timeZone()" />',
})
class Host {
  readonly until = signal(UNTIL);
  readonly now = signal(UNTIL_MS - 37 * MINUTE);
  readonly timeZone = signal('Europe/Warsaw');
}

describe('FcDeadline', () => {
  async function setup(init: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    init(fixture.componentInstance);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const text = () => (root.textContent ?? '').replace(/\s+/g, ' ').trim();
    const badge = () => root.querySelector('fc-badge');
    return { fixture, host: fixture.componentInstance, root, text, badge };
  }

  it('shows the end time in the venue city and the minutes left', async () => {
    const { text, badge } = await setup();

    expect(text()).toBe('Respond by 14:30 (Warsaw) 37 min left');
    expect(badge()?.textContent?.trim()).toBe('37 min left');
  });

  it('rounds the minutes left up', async () => {
    const { text } = await setup((host) => host.now.set(UNTIL_MS - 36 * MINUTE - 30_000));

    expect(text()).toContain('37 min left');
  });

  it('shows one minute for a full minute left', async () => {
    const { text } = await setup((host) => host.now.set(UNTIL_MS - MINUTE));

    expect(text()).toContain('1 min left');
  });

  it('shows "less than 1 min left" under one minute', async () => {
    const { text } = await setup((host) => host.now.set(UNTIL_MS - 59_999));

    expect(text()).toContain('less than 1 min left');
  });

  it('shows no badge at the end time', async () => {
    const { text, badge } = await setup((host) => host.now.set(UNTIL_MS));

    expect(badge()).toBeNull();
    expect(text()).toBe('Respond by 14:30 (Warsaw)');
  });

  it('shows no badge after the end time', async () => {
    const { badge } = await setup((host) => host.now.set(UNTIL_MS + MINUTE));

    expect(badge()).toBeNull();
  });

  it('counts down as now changes', async () => {
    const { fixture, host, text } = await setup();

    host.now.set(UNTIL_MS - 5 * MINUTE);
    await fixture.whenStable();

    expect(text()).toContain('5 min left');
  });

  it('uses the zone for the end time and the label', async () => {
    const { text } = await setup((host) => host.timeZone.set('America/Argentina/Buenos_Aires'));

    expect(text()).toContain('Respond by 10:30 (Buenos Aires)');
  });

  it('has no live region', async () => {
    const { root } = await setup();

    expect(root.querySelector('[aria-live], [role="status"], [role="alert"], [role="timer"]')).toBeNull();
  });
});
