import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcTime, FcTimeFormat, UI_LOCALE } from './time';

@Component({
  imports: [FcTime],
  template: `
    <fc-time
      [value]="value()"
      [timeZone]="timeZone()"
      [format]="format()"
      [now]="now()"
      [durationMinutes]="durationMinutes()"
      [inline]="inline()"
    />
  `,
})
class Host {
  readonly value = signal('2026-11-17T09:00:00Z');
  readonly timeZone = signal('Europe/Warsaw');
  readonly format = signal<FcTimeFormat>('datetime');
  readonly now = signal<number | undefined>(undefined);
  readonly durationMinutes = signal<number | undefined>(undefined);
  readonly inline = signal(false);
}

describe('FcTime', () => {
  async function setup(init: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    init(fixture.componentInstance);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const time = () => root.querySelector('time') as HTMLTimeElement;
    const text = () => (root.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { fixture, host: fixture.componentInstance, root, time, text };
  }

  it('uses the en-GB locale', () => {
    expect(UI_LOCALE).toBe('en-GB');
  });

  describe('datetime', () => {
    it('shows the date, the 24-hour time and the city', async () => {
      const { text } = await setup();

      expect(text()).toBe('Tue 17 Nov, 10:00 Warsaw time');
    });

    it('renders a time element with the instant as datetime', async () => {
      const { time } = await setup();

      expect(time()).not.toBeNull();
      expect(time().getAttribute('datetime')).toBe('2026-11-17T09:00:00Z');
    });

    it('follows daylight saving time', async () => {
      const { text } = await setup((host) => host.value.set('2026-07-14T10:00:00Z'));

      expect(text()).toBe('Tue 14 Jul, 12:00 Warsaw time');
    });

    it('names a zone without a region by its id', async () => {
      const { text } = await setup((host) => host.timeZone.set('UTC'));

      expect(text()).toBe('Tue 17 Nov, 09:00 UTC time');
    });

    it('shows Today when now is on the same local date', async () => {
      const { text } = await setup((host) => {
        host.value.set('2026-11-15T15:00:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Today, 16:00 Warsaw time');
    });

    it('shows Tomorrow when the local date is the day after now', async () => {
      const { text } = await setup((host) => {
        host.value.set('2026-11-16T09:00:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Tomorrow, 10:00 Warsaw time');
    });

    it('uses the venue date, not the UTC date, for Tomorrow', async () => {
      const { text } = await setup((host) => {
        host.value.set('2026-11-15T23:30:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Tomorrow, 00:30 Warsaw time');
    });

    it('shows the plain date when it is neither today nor tomorrow', async () => {
      const { text } = await setup((host) => {
        host.value.set('2026-11-17T09:00:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Tue 17 Nov, 10:00 Warsaw time');
    });

    it('updates when the inputs change', async () => {
      const { fixture, host, text } = await setup();

      host.value.set('2026-11-18T12:30:00Z');
      await fixture.whenStable();

      expect(text()).toBe('Wed 18 Nov, 13:30 Warsaw time');
    });
  });

  describe('a zone that is not valid', () => {
    it('shows the time in UTC with the UTC label instead of throwing', async () => {
      const { text } = await setup((host) => host.timeZone.set('Europe/Warsw'));

      expect(text()).toBe('Tue 17 Nov, 09:00 UTC time');
    });

    it('still gives the Today and range forms in UTC', async () => {
      const { text } = await setup((host) => {
        host.timeZone.set('Europe/Warsw');
        host.format.set('range');
        host.durationMinutes.set(60);
      });

      expect(text()).toBe('09:00–10:00 UTC time');
    });
  });

  describe('inline', () => {
    it('is a block with emphasised text by default', async () => {
      const { root, time } = await setup();

      expect(root.querySelector('fc-time')?.classList.contains('block')).toBe(true);
      expect(time().classList.contains('block')).toBe(true);
      expect(time().classList.contains('text-button')).toBe(true);
    });

    it('sits inside a sentence and inherits its type when inline', async () => {
      const { root, time, text } = await setup((host) => host.inline.set(true));

      const host = root.querySelector('fc-time') as HTMLElement;
      expect(host.classList.contains('inline')).toBe(true);
      expect(host.classList.contains('block')).toBe(false);
      expect(time().classList.contains('block')).toBe(false);
      expect(time().classList.contains('text-button')).toBe(false);
      expect(text()).toBe('Tue 17 Nov, 10:00 Warsaw time');
    });
  });

  describe('day', () => {
    it('shows Today with the date', async () => {
      const { text } = await setup((host) => {
        host.format.set('day');
        host.value.set('2026-11-15T10:00:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Today, Sun 15 Nov');
    });

    it('shows Tomorrow with the date', async () => {
      const { text } = await setup((host) => {
        host.format.set('day');
        host.value.set('2026-11-16T10:00:00Z');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Tomorrow, Mon 16 Nov');
    });

    it('shows only the date for any other day', async () => {
      const { text } = await setup((host) => {
        host.format.set('day');
        host.now.set(Date.parse('2026-11-15T10:00:00Z'));
      });

      expect(text()).toBe('Tue 17 Nov');
    });

    it('shows only the date without now', async () => {
      const { text, time } = await setup((host) => host.format.set('day'));

      expect(text()).toBe('Tue 17 Nov');
      expect(time().getAttribute('datetime')).toBe('2026-11-17T09:00:00Z');
    });
  });

  describe('range', () => {
    it('shows start and end with the city label on a second line', async () => {
      const { time, root } = await setup((host) => {
        host.format.set('range');
        host.value.set('2026-11-17T16:30:00Z');
        host.durationMinutes.set(60);
      });

      expect(time().textContent?.trim()).toBe('17:30–18:30');
      expect(time().getAttribute('datetime')).toBe('2026-11-17T16:30:00Z');
      expect(root.textContent).toContain('Warsaw time');
      expect(time().textContent).not.toContain('Warsaw');
    });

    it('measures the end in real time across a daylight saving change', async () => {
      const { time } = await setup((host) => {
        host.format.set('range');
        host.value.set('2026-03-29T00:30:00Z');
        host.durationMinutes.set(60);
      });

      expect(time().textContent?.trim()).toBe('01:30–03:30');
    });

    it('shows only the start without a duration', async () => {
      const { time } = await setup((host) => host.format.set('range'));

      expect(time().textContent?.trim()).toBe('10:00');
    });
  });
});
