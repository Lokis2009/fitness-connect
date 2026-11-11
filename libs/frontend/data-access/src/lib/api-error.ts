import type { Problem } from './api-types';

/**
 * Typed error for every failed API call. Wraps the RFC 9457 problem details
 * returned by the API. For failures without a problem body (network errors,
 * proxy errors) a synthetic problem is created, so `problem` is never missing.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    /** HTTP status code, or 0 when no response was received. */
    readonly status: number,
    readonly problem: Problem,
    options?: ErrorOptions,
  ) {
    super(problem.detail ?? problem.title, options);
  }

  /** Converts anything thrown by `HttpClient` into an `ApiError`. */
  static from(error: unknown): ApiError {
    throw new Error('not implemented');
  }
}
