import { HttpErrorResponse } from '@angular/common/http';
import type { Problem } from './api-types';

function isProblem(value: unknown): value is Problem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['type'] === 'string' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['status'] === 'number'
  );
}

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
    if (error instanceof ApiError) return error;

    if (error instanceof HttpErrorResponse) {
      if (isProblem(error.error)) {
        return new ApiError(error.status, error.error, { cause: error });
      }
      const title = error.status === 0 ? 'Network error' : error.statusText || 'Request failed';
      return new ApiError(
        error.status,
        { type: 'about:blank', title, status: error.status },
        { cause: error },
      );
    }

    return new ApiError(
      0,
      {
        type: 'about:blank',
        title: 'Unexpected error',
        status: 0,
        detail: error instanceof Error ? error.message : undefined,
      },
      { cause: error },
    );
  }
}
