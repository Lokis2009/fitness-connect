import { type Signal, Service } from '@angular/core';

/**
 * Server-corrected clock. Other code in this library takes `now` from here and never calls
 * `Date.now()` itself, so a wrong device clock does not move deadlines or expiry.
 */
@Service()
export class ClockService {
  /** Epoch milliseconds, server-corrected, ticks every second. */
  get now(): Signal<number> {
    throw new Error('not implemented');
  }

  /** Sets the offset: `Date.parse(serverTime) - Date.now()`. */
  sync(serverTime: string): void {
    void serverTime;
    throw new Error('not implemented');
  }
}
