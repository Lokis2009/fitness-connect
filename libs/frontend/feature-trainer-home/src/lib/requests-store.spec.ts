import { RequestsStore } from './requests-store';

describe('RequestsStore (stub)', () => {
  it('is not implemented yet', () => {
    const store = new RequestsStore();

    expect(() => store.cards).toThrow('not implemented');
    expect(() => store.loadState).toThrow('not implemented');
    expect(() => store.lastUpdated).toThrow('not implemented');
    expect(() => store.accept('b1')).toThrow('not implemented');
    expect(() => store.decline('b1')).toThrow('not implemented');
    expect(() => store.refresh()).toThrow('not implemented');
    expect(() => store.retry()).toThrow('not implemented');
  });
});
