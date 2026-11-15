import { LATE_WINDOW_MS } from './late-window';

describe('LATE_WINDOW_MS', () => {
  it('is 3 hours in milliseconds', () => {
    expect(LATE_WINDOW_MS).toBe(10_800_000);
  });
});
