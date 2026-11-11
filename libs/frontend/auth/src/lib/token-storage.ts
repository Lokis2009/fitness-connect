import { Service } from '@angular/core';

/**
 * Keeps the access token in memory and in `sessionStorage`, so it survives a
 * page reload but not a closed tab.
 */
@Service()
export class TokenStorage {
  get(): string | null {
    throw new Error('not implemented');
  }

  set(token: string): void {
    throw new Error('not implemented');
  }

  clear(): void {
    throw new Error('not implemented');
  }
}
