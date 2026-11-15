import { zoneCity } from './zone-city';

describe('zoneCity', () => {
  it('returns the city of a region zone', () => {
    expect(zoneCity('Europe/Warsaw')).toBe('Warsaw');
  });

  it('turns underscores into spaces and keeps only the last segment', () => {
    expect(zoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
  });

  it('keeps a zone without a region as it is', () => {
    expect(zoneCity('UTC')).toBe('UTC');
  });
});
