import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('returns null when nothing is stored', () => {
    expect(TestBed.inject(TokenStorage).get()).toBeNull();
  });

  it('stores the token in memory and in sessionStorage', () => {
    const storage = TestBed.inject(TokenStorage);
    storage.set('jwt');
    expect(storage.get()).toBe('jwt');
    expect(Object.values(sessionStorage)).toContain('jwt');
  });

  it('survives a reload: a new instance reads the stored token', () => {
    TestBed.inject(TokenStorage).set('jwt');
    TestBed.resetTestingModule();
    expect(TestBed.inject(TokenStorage).get()).toBe('jwt');
  });

  it('clear removes the token from memory and sessionStorage', () => {
    const storage = TestBed.inject(TokenStorage);
    storage.set('jwt');
    storage.clear();
    expect(storage.get()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('falls back to memory when sessionStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const storage = TestBed.inject(TokenStorage);

    storage.set('jwt');
    expect(storage.get()).toBe('jwt');
    storage.clear();
    expect(storage.get()).toBeNull();
  });
});
