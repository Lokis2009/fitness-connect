import { SessionsStore } from './sessions-store';

describe('SessionsStore (stub)', () => {
  it('is not implemented yet', () => {
    const store = new SessionsStore();

    expect(() => store.today).toThrow('not implemented');
    expect(() => store.tomorrow).toThrow('not implemented');
    expect(() => store.loadState).toThrow('not implemented');
    expect(() => store.refresh()).toThrow('not implemented');
    expect(() => store.retry()).toThrow('not implemented');
  });
});
