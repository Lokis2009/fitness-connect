import { InjectionToken, Service } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  DevLoginRequest,
  DevLoginResponse,
  HealthStatus,
  User,
} from './api-types';

/** Base URL of the HTTP API as seen from the browser (the dev proxy maps it). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api/v1',
});

/**
 * Typed client for the fitness-connect HTTP API (contract: `@fitness-connect/api-contract`).
 *
 * Every method returns a cold `Observable` that emits once and completes, and
 * errors with an `ApiError`. Authentication headers are added by the
 * interceptor in `@fitness-connect/auth`, not here.
 */
@Service()
export class ApiClient {
  /** `GET /v1/health` */
  getHealth(): Observable<HealthStatus> {
    throw new Error('not implemented');
  }

  /** `GET /v1/me`: the signed-in user. Errors with status 401 without a valid token. */
  getMe(): Observable<User> {
    throw new Error('not implemented');
  }

  /** `POST /v1/dev/login`: development only. Errors with status 401 on bad credentials. */
  devLogin(body: DevLoginRequest): Observable<DevLoginResponse> {
    throw new Error('not implemented');
  }
}
