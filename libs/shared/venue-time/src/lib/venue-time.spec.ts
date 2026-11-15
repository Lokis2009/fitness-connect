import { tomorrowNoon, zoneOffsetMs } from './venue-time';

describe('venue-time skeleton', () => {
  it('has not been implemented yet', () => {
    expect(() => zoneOffsetMs('UTC', 0)).toThrow('not implemented');
    expect(() => tomorrowNoon('UTC', new Date(0))).toThrow('not implemented');
  });
});
