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

  /** The device clock, to stamp the moment a request is sent. Pass it to `sync` with the response. */
  deviceNow(): number {
    return Date.now();
  }

  /**
   * Sets the offset from a server time. The server read its time somewhere between the moment the
   * request was sent (`sentAt`, from `deviceNow()`) and the moment the response arrived, so the
   * middle of that round trip is the best guess. Without `sentAt` the arrival time is used.
   * A value that is not a date is ignored.
   */
  sync(serverTime: string, sentAt?: number): void {
    const server = Date.parse(serverTime);
    if (Number.isNaN(server)) {
      return;
    }
    const received = Date.now();
    const readAt = sentAt === undefined ? received : (sentAt + received) / 2;
    this.offset = server - readAt;
    this.current.set(received + this.offset);
  }
}
