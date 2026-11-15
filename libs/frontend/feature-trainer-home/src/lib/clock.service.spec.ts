import { TestBed } from '@angular/core/testing';
import { ClockService } from './clock.service';

describe('ClockService (stub)', () => {
  it('is not implemented yet', () => {
    const clock = TestBed.inject(ClockService);

    expect(() => clock.now).toThrow('not implemented');
    expect(() => clock.sync('2026-11-15T10:00:00Z')).toThrow('not implemented');
  });
});
