import { isUuid } from './uuid';

describe('isUuid', () => {
  it('accepts a UUID in lower or upper case', () => {
    expect(isUuid('5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40')).toBe(true);
    expect(isUuid('5B1E6C2E-0F5E-4A3B-9D6F-0A6C1D2E3F40')).toBe(true);
  });

  it('rejects text that is not a UUID', () => {
    expect(isUuid('')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('5b1e6c2e0f5e4a3b9d6f0a6c1d2e3f40')).toBe(false);
    expect(isUuid('5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f4')).toBe(false);
    expect(isUuid('5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f4g')).toBe(false);
  });

  it('rejects a UUID with anything around it', () => {
    expect(isUuid(' 5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40')).toBe(false);
    expect(isUuid('5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40\n')).toBe(false);
    expect(isUuid('{5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40}')).toBe(false);
  });
});
