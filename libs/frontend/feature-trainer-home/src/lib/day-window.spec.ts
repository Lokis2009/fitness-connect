import { dayOf, dayWindow, hasEnded } from './day-window';

describe('day window (stubs)', () => {
  it('dayWindow is not implemented yet', () => {
    expect(() => dayWindow(0, 'Europe/Warsaw')).toThrow('not implemented');
  });

  it('dayOf is not implemented yet', () => {
    expect(() => dayOf(0, 'Europe/Warsaw', 0)).toThrow('not implemented');
  });

  it('hasEnded is not implemented yet', () => {
    expect(() => hasEnded(0, 60, 0)).toThrow('not implemented');
  });
});
