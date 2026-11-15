import { HttpClient } from '@angular/common/http';
import { InjectionToken, Service, inject } from '@angular/core';
import { type Observable, catchError, throwError } from 'rxjs';
import { ApiError } from './api-error';
import type {
  Booking,
  BookingRequestList,
  DevLoginRequest,
  DevLoginResponse,
  HealthStatus,
  SessionList,
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
 * errors with an `ApiError`. Observables (not Promises) are used because they
 * are what `HttpClient` returns, they are lazy and cancellable, and they compose
 * with `async` pipe, `toSignal` and `rxResource`; use `firstValueFrom` where a
 * Promise is more convenient. Authentication headers are added by the
 * interceptor in `@fitness-connect/auth`, not here.
 */
@Service()
export class ApiClient {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = inject(API_BASE_URL);

  /** `GET /v1/health` */
  getHealth(): Observable<HealthStatus> {
    return this.#request(
      this.#http.get<HealthStatus>(`${this.#baseUrl}/health`),
    );
  }

  /** `GET /v1/me`: the signed-in user. Errors with status 401 without a valid token. */
  getMe(): Observable<User> {
    return this.#request(this.#http.get<User>(`${this.#baseUrl}/me`));
  }

  /** `POST /v1/dev/login`: development only. Errors with status 401 on bad credentials. */
  devLogin(body: DevLoginRequest): Observable<DevLoginResponse> {
    return this.#request(
      this.#http.post<DevLoginResponse>(`${this.#baseUrl}/dev/login`, body),
    );
  }

  /** `GET /v1/trainers/me/booking-requests`: the trainer's pending requests. */
  getBookingRequests(): Observable<BookingRequestList> {
    return this.#request(
      this.#http.get<BookingRequestList>(
        `${this.#baseUrl}/trainers/me/booking-requests`,
      ),
    );
  }

  /**
   * `GET /v1/trainers/me/sessions`: the trainer's confirmed sessions that overlap `[from, to)`.
   * `from` and `to` are ISO instants.
   */
  getSessions(from: string, to: string): Observable<SessionList> {
    return this.#request(
      this.#http.get<SessionList>(`${this.#baseUrl}/trainers/me/sessions`, {
        params: { from, to },
      }),
    );
  }

  /** `POST /v1/bookings/{id}/accept`: accepts a pending request. */
  acceptBooking(id: string): Observable<Booking> {
    return this.#request(
      this.#http.post<Booking>(
        `${this.#baseUrl}/bookings/${encodeURIComponent(id)}/accept`,
        null,
      ),
    );
  }

  /** `POST /v1/bookings/{id}/decline`: declines a pending request. */
  declineBooking(id: string): Observable<Booking> {
    return this.#request(
      this.#http.post<Booking>(
        `${this.#baseUrl}/bookings/${encodeURIComponent(id)}/decline`,
        null,
      ),
    );
  }

  #request<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError((error: unknown) => throwError(() => ApiError.from(error))),
    );
  }
}
