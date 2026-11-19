import type { Subscription } from 'rxjs';
import { REFRESH_INTERVAL_MS, refreshTrigger } from './refresh-trigger';

let visibility: 'visible' | 'hidden' = 'visible';

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('refreshTrigger', () => {
  let subscription: Subscription | undefined;
  let emissions: number;

  function start(): void {
    emissions = 0;
    subscription = refreshTrigger().subscribe(() => emissions++);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  });

  afterEach(() => {
    subscription?.unsubscribe();
    subscription = undefined;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('refreshes every 30 seconds', () => {
    expect(REFRESH_INTERVAL_MS).toBe(30_000);
  });

  it('emits on start while the tab is visible', () => {
    start();

    expect(emissions).toBe(1);
  });

  it('emits again after each interval while visible', () => {
    start();

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    expect(emissions).toBe(1);

    vi.advanceTimersByTime(1);
    expect(emissions).toBe(2);

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(emissions).toBe(3);
  });

  it('emits nothing while the tab is hidden', () => {
    start();
    setVisibility('hidden');
    emissions = 0;

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 5);

    expect(emissions).toBe(0);
  });

  it('emits when the tab becomes visible and restarts the interval', () => {
    start();
    setVisibility('hidden');
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    emissions = 0;

    setVisibility('visible');
    expect(emissions).toBe(1);

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    expect(emissions).toBe(1);
    vi.advanceTimersByTime(1);
    expect(emissions).toBe(2);
  });

  it('does not emit twice for a visibility event that changes nothing', () => {
    start();
    emissions = 0;

    setVisibility('visible');

    expect(emissions).toBe(0);
  });

  it('emits once on start when the tab starts hidden, then waits for it to be visible', () => {
    visibility = 'hidden';
    start();
    expect(emissions).toBe(1);

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3);
    expect(emissions).toBe(1);

    setVisibility('visible');
    expect(emissions).toBe(2);
  });

  it('stops everything on unsubscribe', () => {
    start();
    subscription?.unsubscribe();
    emissions = 0;

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    setVisibility('visible');

    expect(emissions).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives each subscriber its own interval', () => {
    const trigger = refreshTrigger();
    let first = 0;
    let second = 0;
    const a = trigger.subscribe(() => first++);
    vi.advanceTimersByTime(10_000);
    const b = trigger.subscribe(() => second++);

    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 10_000);
    expect(first).toBe(2);
    expect(second).toBe(1);

    vi.advanceTimersByTime(10_000);
    expect(second).toBe(2);
    a.unsubscribe();
    b.unsubscribe();
  });
});
