import { DestroyRef, Service, inject, signal } from '@angular/core';

const TICK_MS = 1000;

/**
 * Server-corrected clock. Other code in this library takes `now` from here and never calls
 * `Date.now()` itself, so a wrong device clock does not move deadlines or expiry.
 */
@Service()
export class ClockService {
  private offset = 0;
  private readonly current = signal(Date.now());

  /** Epoch milliseconds, server-corrected, ticks every second. */
  readonly now = this.current.asReadonly();

  constructor() {
    const timer = setInterval(() => this.current.set(Date.now() + this.offset), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Sets the offset: `Date.parse(serverTime) - Date.now()`. A value that is not a date is ignored. */
  sync(serverTime: string): void {
    const server = Date.parse(serverTime);
    if (Number.isNaN(server)) {
      return;
    }
    const device = Date.now();
    this.offset = server - device;
    this.current.set(server);
  }
}
