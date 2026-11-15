import { TestBed } from '@angular/core/testing';
import { ClockService } from './clock.service';

const DEVICE_TIME = Date.parse('2026-11-15T10:00:00Z');

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(DEVICE_TIME);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('starts at the device time before the first sync', () => {
    const clock = TestBed.inject(ClockService);

    expect(clock.now()).toBe(DEVICE_TIME);
  });

  it('sync moves now to the server time at once', () => {
    const clock = TestBed.inject(ClockService);

    clock.sync('2026-11-15T10:05:00Z');

    expect(clock.now()).toBe(Date.parse('2026-11-15T10:05:00Z'));
  });

  it('deviceNow is the device clock, for stamping the moment a request is sent', () => {
    const clock = TestBed.inject(ClockService);
    clock.sync('2026-11-15T10:05:00Z');

    expect(clock.deviceNow()).toBe(DEVICE_TIME);
  });

  it('assumes the server read its time in the middle of the round trip', () => {
    const clock = TestBed.inject(ClockService);
    const sentAt = clock.deviceNow();
    vi.advanceTimersByTime(2000);

    // The request took 2 s and the server time falls in its middle: the device clock is right.
    clock.sync('2026-11-15T10:00:01Z', sentAt);

    expect(clock.now()).toBe(DEVICE_TIME + 2000);
    vi.advanceTimersByTime(1000);
    expect(clock.now()).toBe(DEVICE_TIME + 3000);
  });

  it('keeps a fixed offset from the middle of the round trip when the device clock is off', () => {
    const clock = TestBed.inject(ClockService);
    const sentAt = clock.deviceNow();
    vi.advanceTimersByTime(4000);

    // The server says 10:05:02 at the middle (10:00:02 on the device): the device is 5 minutes slow.
    clock.sync('2026-11-15T10:05:02Z', sentAt);

    expect(clock.now()).toBe(Date.parse('2026-11-15T10:05:04Z'));
  });

  it('ticks once a second and keeps the offset', () => {
    const clock = TestBed.inject(ClockService);
    clock.sync('2026-11-15T10:05:00Z');
    const synced = clock.now();

    vi.advanceTimersByTime(1000);
    expect(clock.now()).toBe(synced + 1000);

    vi.advanceTimersByTime(4000);
    expect(clock.now()).toBe(synced + 5000);
  });

  it('does not change between ticks', () => {
    const clock = TestBed.inject(ClockService);
    const first = clock.now();

    vi.advanceTimersByTime(999);

    expect(clock.now()).toBe(first);
  });

  it('gives the same result whatever the device clock says', () => {
    const server = '2026-11-15T10:05:00Z';
    const fast = TestBed.inject(ClockService);
    fast.sync(server);
    const fromFastDevice = fast.now();
    TestBed.resetTestingModule();

    vi.setSystemTime(DEVICE_TIME - 3 * 60 * 60 * 1000);
    const slow = TestBed.inject(ClockService);
    slow.sync(server);

    expect(slow.now()).toBe(fromFastDevice);
    vi.advanceTimersByTime(2000);
    expect(slow.now()).toBe(fromFastDevice + 2000);
  });

  it('uses the latest sync', () => {
    const clock = TestBed.inject(ClockService);
    clock.sync('2026-11-15T10:05:00Z');

    clock.sync('2026-11-15T09:59:00Z');

    expect(clock.now()).toBe(Date.parse('2026-11-15T09:59:00Z'));
  });

  it('ignores a server time that is not a date', () => {
    const clock = TestBed.inject(ClockService);
    clock.sync('2026-11-15T10:05:00Z');
    const synced = clock.now();

    clock.sync('not a date');

    expect(clock.now()).toBe(synced);
    vi.advanceTimersByTime(1000);
    expect(clock.now()).toBe(synced + 1000);
  });

  it('stops ticking when it is destroyed', () => {
    TestBed.inject(ClockService);
    expect(vi.getTimerCount()).toBe(1);

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
  });
});
