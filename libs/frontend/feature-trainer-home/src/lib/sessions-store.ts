import { type Signal, Service } from '@angular/core';
import type { Session } from '@fitness-connect/data-access';
import type { LoadState } from './requests-store';

/**
 * Confirmed sessions of today and tomorrow in the venue's time zone. Provided in `TrainerHome`'s
 * `providers`, so it lives until the page is left.
 */
@Service({ autoProvided: false })
export class SessionsStore {
  get today(): Signal<Session[]> {
    throw new Error('not implemented');
  }

  get tomorrow(): Signal<Session[]> {
    throw new Error('not implemented');
  }

  get loadState(): Signal<LoadState> {
    throw new Error('not implemented');
  }

  refresh(): void {
    throw new Error('not implemented');
  }

  retry(): void {
    throw new Error('not implemented');
  }
}
