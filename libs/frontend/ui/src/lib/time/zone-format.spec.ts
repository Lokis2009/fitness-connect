import { UI_LOCALE, dayOffset, formatClock, formatShortDate } from './zone-format';

const WARSAW = 'Europe/Warsaw';

describe('zone-format', () => {
  it('formats in one fixed locale', () => {
    expect(UI_LOCALE).toBe('en-GB');
  });

  it('formats a short date in the zone', () => {
    expect(formatShortDate(Date.parse('2026-11-17T09:00:00Z'), WARSAW)).toBe('Tue 17 Nov');
  });

  it('takes the date from the zone, not from UTC', () => {
    expect(formatShortDate(Date.parse('2026-11-15T23:30:00Z'), WARSAW)).toBe('Mon 16 Nov');
  });

  it('formats a 24-hour clock with winter and summer offsets', () => {
    expect(formatClock(Date.parse('2026-11-17T09:00:00Z'), WARSAW)).toBe('10:00');
    expect(formatClock(Date.parse('2026-07-14T10:00:00Z'), WARSAW)).toBe('12:00');
  });

  it('shows local midnight as 00:00, not 24:00', () => {
    expect(formatClock(Date.parse('2026-11-16T23:05:00Z'), WARSAW)).toBe('00:05');
  });

  it('counts local days between an instant and now', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    expect(dayOffset(Date.parse('2026-11-15T20:00:00Z'), now, WARSAW)).toBe(0);
    expect(dayOffset(Date.parse('2026-11-16T10:00:00Z'), now, WARSAW)).toBe(1);
    expect(dayOffset(Date.parse('2026-11-17T10:00:00Z'), now, WARSAW)).toBe(2);
    expect(dayOffset(Date.parse('2026-11-14T10:00:00Z'), now, WARSAW)).toBe(-1);
  });

  it('uses local dates across the UTC day boundary', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    // 23:30 UTC is already Monday 00:30 in Warsaw, so it is tomorrow.
    expect(dayOffset(Date.parse('2026-11-15T23:30:00Z'), now, WARSAW)).toBe(1);
  });
});
