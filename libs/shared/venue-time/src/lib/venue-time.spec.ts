import { tomorrowNoon, zoneOffsetMs } from './venue-time';

const HOUR = 3_600_000;
const WARSAW = 'Europe/Warsaw';

describe('zoneOffsetMs', () => {
  it('is zero for UTC', () => {
    expect(zoneOffsetMs('UTC', Date.parse('2026-11-17T09:00:00Z'))).toBe(0);
  });

  it('follows the winter and summer offsets of a zone', () => {
    expect(zoneOffsetMs(WARSAW, Date.parse('2026-11-17T09:00:00Z'))).toBe(HOUR);
    expect(zoneOffsetMs(WARSAW, Date.parse('2026-07-14T10:00:00Z'))).toBe(2 * HOUR);
  });

  it('is negative for a zone behind UTC', () => {
    expect(zoneOffsetMs('America/New_York', Date.parse('2026-11-17T09:00:00Z'))).toBe(-5 * HOUR);
  });

  it('is a whole number of seconds for an instant with milliseconds', () => {
    expect(zoneOffsetMs(WARSAW, Date.parse('2026-11-17T09:00:00.789Z'))).toBe(HOUR);
  });
});

describe('tomorrowNoon', () => {
  const noon = (zone: string, now: string) => tomorrowNoon(zone, new Date(now)).toISOString();

  it('is noon on the next local day', () => {
    expect(noon(WARSAW, '2026-11-15T10:00:00Z')).toBe('2026-11-16T11:00:00.000Z');
  });

  it('uses the local date, not the UTC date, in a zone behind UTC', () => {
    // 03:00 UTC on the 15th is 22:00 on the 14th in New York, so tomorrow is the 15th.
    expect(noon('America/New_York', '2026-11-15T03:00:00Z')).toBe('2026-11-15T17:00:00.000Z');
  });

  it('uses the local date, not the UTC date, in a zone ahead of UTC', () => {
    // 23:00 UTC on the 15th is 12:00 on the 16th in Auckland, so tomorrow is the 17th.
    expect(noon('Pacific/Auckland', '2026-11-15T23:00:00Z')).toBe('2026-11-16T23:00:00.000Z');
  });

  it('moves to the next day just after local midnight', () => {
    expect(noon(WARSAW, '2026-11-15T22:30:00Z')).toBe('2026-11-16T11:00:00.000Z');
    expect(noon(WARSAW, '2026-11-15T23:30:00Z')).toBe('2026-11-17T11:00:00.000Z');
  });

  it('applies the offset of tomorrow when the clocks change tonight (spring forward)', () => {
    // Warsaw changes to summer time on Sunday 29 March 2026, so noon that day is UTC+2.
    expect(noon(WARSAW, '2026-03-28T10:00:00Z')).toBe('2026-03-29T10:00:00.000Z');
  });

  it('applies the offset of tomorrow when the clocks change tonight (fall back)', () => {
    // Warsaw changes back to winter time on Sunday 25 October 2026, so noon that day is UTC+1.
    expect(noon(WARSAW, '2026-10-24T10:00:00Z')).toBe('2026-10-25T11:00:00.000Z');
  });

  it('crosses the end of a month and of a year', () => {
    expect(noon(WARSAW, '2026-11-30T10:00:00Z')).toBe('2026-12-01T11:00:00.000Z');
    expect(noon(WARSAW, '2026-12-31T10:00:00Z')).toBe('2027-01-01T11:00:00.000Z');
  });
});
