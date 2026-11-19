import { dayOf, dayWindow, hasEnded } from './day-window';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function utc(iso: string): number {
  return Date.parse(iso);
}

describe('dayWindow', () => {
  it('spans the start of today to the end of tomorrow in the zone', () => {
    // 11:00 in Warsaw (UTC+1)
    const window = dayWindow(utc('2026-11-15T10:00:00Z'), 'Europe/Warsaw');

    expect(window).toEqual({
      from: utc('2026-11-14T23:00:00Z'), // 15 Nov 00:00 local
      to: utc('2026-11-16T23:00:00Z'), // 17 Nov 00:00 local
    });
  });

  it('uses the local date, not the UTC date', () => {
    // 23:30 UTC on 15 Nov is already 16 Nov in Warsaw
    const window = dayWindow(utc('2026-11-15T23:30:00Z'), 'Europe/Warsaw');

    expect(window.from).toBe(utc('2026-11-15T23:00:00Z'));
    expect(window.to).toBe(utc('2026-11-17T23:00:00Z'));
  });

  it('uses the previous local date for a zone behind UTC', () => {
    // 02:00 UTC on 16 Nov is 18:00 on 15 Nov in Los Angeles (UTC-8)
    const window = dayWindow(utc('2026-11-16T02:00:00Z'), 'America/Los_Angeles');

    expect(window.from).toBe(utc('2026-11-15T08:00:00Z'));
    expect(window.to).toBe(utc('2026-11-17T08:00:00Z'));
  });

  it('starts exactly at now when now is local midnight', () => {
    const now = utc('2026-11-14T23:00:00Z');

    expect(dayWindow(now, 'Europe/Warsaw').from).toBe(now);
  });

  it('keeps the instant just before local midnight in the previous day', () => {
    const now = utc('2026-11-14T23:00:00Z') - 1;

    expect(dayWindow(now, 'Europe/Warsaw').from).toBe(utc('2026-11-13T23:00:00Z'));
  });

  it('handles the zone furthest ahead of UTC', () => {
    // Kiritimati is UTC+14: 10:00 UTC on 15 Jun is exactly 00:00 on 16 Jun
    const now = utc('2026-06-15T10:00:00Z');

    expect(dayWindow(now, 'Pacific/Kiritimati')).toEqual({
      from: now,
      to: now + 48 * HOUR,
    });
  });

  it('handles the zone furthest behind UTC', () => {
    // UTC-12: 12:00 UTC is exactly 00:00 local the same day
    const now = utc('2026-06-15T12:00:00Z');

    expect(dayWindow(now, 'Etc/GMT+12')).toEqual({
      from: now,
      to: now + 48 * HOUR,
    });
  });

  it('works in UTC', () => {
    expect(dayWindow(utc('2026-11-15T10:00:00Z'), 'UTC')).toEqual({
      from: utc('2026-11-15T00:00:00Z'),
      to: utc('2026-11-17T00:00:00Z'),
    });
  });

  describe('daylight saving changes', () => {
    it('spans 47 hours across the spring change (Warsaw, 29 Mar 2026)', () => {
      const window = dayWindow(utc('2026-03-29T10:00:00Z'), 'Europe/Warsaw');

      expect(window.from).toBe(utc('2026-03-28T23:00:00Z')); // 00:00 CET
      expect(window.to).toBe(utc('2026-03-30T22:00:00Z')); // 00:00 CEST on the 31st
      expect(window.to - window.from).toBe(47 * HOUR);
    });

    it('spans 49 hours across the autumn change (Warsaw, 25 Oct 2026)', () => {
      const window = dayWindow(utc('2026-10-25T10:00:00Z'), 'Europe/Warsaw');

      expect(window.from).toBe(utc('2026-10-24T22:00:00Z')); // 00:00 CEST
      expect(window.to).toBe(utc('2026-10-26T23:00:00Z')); // 00:00 CET on the 27th
      expect(window.to - window.from).toBe(49 * HOUR);
    });

    it('ends tomorrow at the right instant when the change is tomorrow', () => {
      // Today is Sat 28 Mar, the change is on Sun 29 Mar, so 30 Mar 00:00 is CEST
      const window = dayWindow(utc('2026-03-28T10:00:00Z'), 'Europe/Warsaw');

      expect(window.from).toBe(utc('2026-03-27T23:00:00Z'));
      expect(window.to).toBe(utc('2026-03-29T22:00:00Z'));
    });

    it('handles a half-hour zone (Lord Howe)', () => {
      // Lord Howe is UTC+10:30 in winter, 00:00 on 15 Jun is 13:30 UTC on 14 Jun
      const window = dayWindow(utc('2026-06-15T01:00:00Z'), 'Australia/Lord_Howe');

      expect(window.from).toBe(utc('2026-06-14T13:30:00Z'));
      expect(window.to).toBe(utc('2026-06-16T13:30:00Z'));
    });
  });

  describe('a zone whose midnight does not exist', () => {
    // Sao Paulo skipped from 23:59:59 on 3 Nov 2018 to 01:00 on 4 Nov 2018 (-03 to -02)
    const zone = 'America/Sao_Paulo';

    it('starts the day at the first instant that exists', () => {
      const window = dayWindow(utc('2018-11-04T12:00:00Z'), zone);

      expect(window.from).toBe(utc('2018-11-04T03:00:00Z')); // 01:00 local, -02
      expect(window.to).toBe(utc('2018-11-06T02:00:00Z')); // 00:00 local on the 6th, -02
    });

    it('puts the instant before the gap on the previous day', () => {
      const window = dayWindow(utc('2018-11-04T02:59:59Z'), zone);

      expect(window.from).toBe(utc('2018-11-03T03:00:00Z')); // 00:00 local on the 3rd, -03
      expect(window.to).toBe(utc('2018-11-05T02:00:00Z')); // 00:00 local on the 5th, -02
    });

    it('ends the window after a tomorrow that has no midnight', () => {
      // Today is 3 Nov, tomorrow is the day without a midnight, so `to` is 00:00 on the 5th
      const window = dayWindow(utc('2018-11-03T12:00:00Z'), zone);

      expect(window.from).toBe(utc('2018-11-03T03:00:00Z'));
      expect(window.to).toBe(utc('2018-11-05T02:00:00Z'));
    });
  });
});

describe('dayOf', () => {
  const zone = 'Europe/Warsaw';
  const now = utc('2026-11-15T10:00:00Z'); // Sun 15 Nov, 11:00 local

  it('is today for a session later today', () => {
    expect(dayOf(utc('2026-11-15T15:00:00Z'), zone, now)).toBe('today');
  });

  it('is today for a session earlier today, even one that has passed', () => {
    expect(dayOf(utc('2026-11-15T05:00:00Z'), zone, now)).toBe('today');
  });

  it('is tomorrow for a session tomorrow', () => {
    expect(dayOf(utc('2026-11-16T11:00:00Z'), zone, now)).toBe('tomorrow');
  });

  it('is null for yesterday and for the day after tomorrow', () => {
    expect(dayOf(utc('2026-11-14T22:59:59Z'), zone, now)).toBeNull();
    expect(dayOf(utc('2026-11-16T23:00:00Z'), zone, now)).toBeNull();
    expect(dayOf(utc('2026-11-20T10:00:00Z'), zone, now)).toBeNull();
  });

  it('switches day at local midnight, not at UTC midnight', () => {
    expect(dayOf(utc('2026-11-14T23:00:00Z'), zone, now)).toBe('today'); // 00:00 local
    expect(dayOf(utc('2026-11-15T22:59:59Z'), zone, now)).toBe('today'); // 23:59:59 local
    expect(dayOf(utc('2026-11-15T23:00:00Z'), zone, now)).toBe('tomorrow'); // 00:00 local
    expect(dayOf(utc('2026-11-16T22:59:59Z'), zone, now)).toBe('tomorrow');
  });

  it('puts a 00:30 local session on another UTC day under the local day', () => {
    // 00:30 on 16 Nov in Warsaw is 23:30 UTC on 15 Nov, the same UTC date as now
    expect(dayOf(utc('2026-11-15T23:30:00Z'), zone, now)).toBe('tomorrow');
    // 00:30 on 15 Nov in Warsaw is 23:30 UTC on 14 Nov, the UTC day before now
    expect(dayOf(utc('2026-11-14T23:30:00Z'), zone, now)).toBe('today');
  });

  it('puts a late evening session in a zone behind UTC under the local day', () => {
    const losAngeles = 'America/Los_Angeles';
    const laNow = utc('2026-11-15T20:00:00Z'); // 12:00 on 15 Nov
    // 23:30 on 15 Nov in Los Angeles is 07:30 UTC on 16 Nov
    expect(dayOf(utc('2026-11-16T07:30:00Z'), losAngeles, laNow)).toBe('today');
    expect(dayOf(utc('2026-11-16T08:00:00Z'), losAngeles, laNow)).toBe('tomorrow');
  });

  it('follows the month and year boundary', () => {
    const newYearsEve = utc('2026-12-31T12:00:00Z');

    expect(dayOf(utc('2027-01-01T12:00:00Z'), zone, newYearsEve)).toBe('tomorrow');
    expect(dayOf(utc('2027-01-02T12:00:00Z'), zone, newYearsEve)).toBeNull();
  });

  it('follows the end of February in a leap year', () => {
    const leapDay = utc('2028-02-28T12:00:00Z');

    expect(dayOf(utc('2028-02-29T12:00:00Z'), zone, leapDay)).toBe('tomorrow');
    expect(dayOf(utc('2028-03-01T12:00:00Z'), zone, leapDay)).toBeNull();
  });

  it('keeps tomorrow correct across a daylight saving change', () => {
    const saturday = utc('2026-03-28T10:00:00Z');

    // Sun 29 Mar 00:30 CET and 23:30 CEST
    expect(dayOf(utc('2026-03-28T23:30:00Z'), zone, saturday)).toBe('tomorrow');
    expect(dayOf(utc('2026-03-29T21:30:00Z'), zone, saturday)).toBe('tomorrow');
    // Mon 30 Mar 00:30 CEST
    expect(dayOf(utc('2026-03-29T22:30:00Z'), zone, saturday)).toBeNull();
  });

  it('knows a day without a midnight', () => {
    const saoPaulo = 'America/Sao_Paulo';
    const nov3 = utc('2018-11-03T12:00:00Z');

    expect(dayOf(utc('2018-11-04T03:00:00Z'), saoPaulo, nov3)).toBe('tomorrow'); // 01:00 on the 4th
    expect(dayOf(utc('2018-11-05T01:59:59Z'), saoPaulo, nov3)).toBe('tomorrow'); // 23:59:59 on the 4th
    expect(dayOf(utc('2018-11-05T02:00:00Z'), saoPaulo, nov3)).toBeNull();
  });

  it.each([
    ['Europe/Warsaw', utc('2026-03-29T10:00:00Z')],
    ['Europe/Warsaw', utc('2026-10-25T10:00:00Z')],
    ['America/Sao_Paulo', utc('2018-11-04T12:00:00Z')],
    ['America/Sao_Paulo', utc('2018-11-03T12:00:00Z')],
    ['Australia/Lord_Howe', utc('2026-10-04T01:00:00Z')],
    ['Pacific/Kiritimati', utc('2026-06-15T10:00:00Z')],
  ])('agrees with dayWindow on every quarter hour in %s around %i', (tz, at) => {
    const window = dayWindow(at, tz);

    for (let t = window.from - 3 * 24 * HOUR; t < window.to + 3 * 24 * HOUR; t += 15 * MINUTE) {
      const inside = t >= window.from && t < window.to;
      expect(dayOf(t, tz, at) !== null, new Date(t).toISOString()).toBe(inside);
    }
  });
});

describe('hasEnded', () => {
  const startsAt = utc('2026-11-15T10:00:00Z');

  it('is false before the end', () => {
    expect(hasEnded(startsAt, 60, startsAt + 60 * MINUTE - 1)).toBe(false);
  });

  it('is true when the session ends exactly now', () => {
    expect(hasEnded(startsAt, 60, startsAt + 60 * MINUTE)).toBe(true);
  });

  it('is true after the end', () => {
    expect(hasEnded(startsAt, 60, startsAt + 60 * MINUTE + 1)).toBe(true);
  });

  it('is false for a session that has not started', () => {
    expect(hasEnded(startsAt, 60, startsAt - HOUR)).toBe(false);
  });

  it('is false while the session is in progress', () => {
    expect(hasEnded(startsAt, 60, startsAt + 15 * MINUTE)).toBe(false);
  });
});
