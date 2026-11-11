# data-access

Typed HTTP client for the fitness-connect API. Import path: `@fitness-connect/data-access`. Tags: `scope:shared`, `type:data-access`. No UI markup.

Types come from the OpenAPI contract (`@fitness-connect/api-contract`, generated in `libs/shared/api-contract/src/generated/api.d.ts`).

## Public API

| Export | Description |
| --- | --- |
| `ApiClient` | Root service over `HttpClient`. |
| `ApiClient.getHealth(): Observable<HealthStatus>` | `GET /v1/health` |
| `ApiClient.getMe(): Observable<User>` | `GET /v1/me` (needs a bearer token) |
| `ApiClient.devLogin(body: DevLoginRequest): Observable<DevLoginResponse>` | `POST /v1/dev/login` (development only) |
| `ApiError` | Error thrown by every failed call. `status` (0 when no response), `problem` (RFC 9457 `Problem`), `message` (problem `detail`, else `title`), `cause` (original `HttpErrorResponse`). `ApiError.from(unknown)` converts any thrown value. |
| `API_BASE_URL` | `InjectionToken<string>`, default `/api/v1`. Override only when the API is not behind the dev proxy. |
| `Role`, `User`, `HealthStatus`, `DevLoginRequest`, `DevLoginResponse`, `Problem` | Type aliases of the contract schemas. |

## Behavior

- All methods return cold Observables that emit once and complete (what `HttpClient` returns; lazy and cancellable). Use `firstValueFrom` for a Promise.
- Failures never leak `HttpErrorResponse`: they are mapped to `ApiError`. A body that is not problem details (proxy error page, network failure) becomes a synthetic problem with type `about:blank`.
- The client does not add auth headers. Register `authInterceptor` from `@fitness-connect/auth`.

```ts
inject(ApiClient)
  .getMe()
  .subscribe({
    next: (user) => console.log(user.displayName),
    error: (e: ApiError) => console.warn(e.status, e.problem.title),
  });
```

## Running unit tests

Run `pnpm nx test data-access` (add `--coverage` for the 80% gate).
