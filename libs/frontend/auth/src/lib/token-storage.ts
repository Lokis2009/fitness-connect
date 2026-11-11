import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';

const STORAGE_KEY = 'fc.access-token';

/**
 * Keeps the access token in memory and in `sessionStorage`, so it survives a
 * page reload but not a closed tab. When `sessionStorage` is unavailable
 * (blocked, or no browser) the token lives in memory only.
 */
@Service()
export class TokenStorage {
  readonly #document = inject(DOCUMENT);
  #token: string | null = null;

  get(): string | null {
    if (this.#token === null) {
      this.#token = this.#read();
    }
    return this.#token;
  }

  set(token: string): void {
    this.#token = token;
    try {
      this.#storage()?.setItem(STORAGE_KEY, token);
    } catch {
      // sessionStorage is unavailable: keep the in-memory copy only.
    }
  }

  clear(): void {
    this.#token = null;
    try {
      this.#storage()?.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage is unavailable: nothing persisted to remove.
    }
  }

  #read(): string | null {
    try {
      return this.#storage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  #storage(): Storage | undefined {
    return this.#document.defaultView?.sessionStorage;
  }
}
