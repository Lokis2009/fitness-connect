import { REFRESH_INTERVAL_MS, refreshTrigger } from './refresh-trigger';

describe('refresh trigger (stub)', () => {
  it('refreshes every 30 seconds', () => {
    expect(REFRESH_INTERVAL_MS).toBe(30_000);
  });

  it('refreshTrigger is not implemented yet', () => {
    expect(() => refreshTrigger()).toThrow('not implemented');
  });
});
