# auth

Authentication for the client, trainer and admin apps. Import path: `@fitness-connect/auth`. Tags: `scope:shared`, `type:data-access`. No UI markup: the login pages live in a feature lib built from `@fitness-connect/ui`.

## Public API

| Export | Description |
| --- | --- |
| `AuthService` | Abstract class used as the DI token. Always inject this. |
| `AuthService.user: Signal<User \| null>` | The signed-in user. |
| `AuthService.isAuthenticated: Signal<boolean>` | `true` while signed in. |
| `AuthService.accessToken(): string \| null` | Current bearer token. |
| `AuthService.signIn(returnUrl?: string): void` | Starts sign-in. Production will redirect to the Cognito hosted login, so do not assume a password form. |
| `AuthService.signOut(): void` | Clears the session. Does not navigate. |
| `AuthService.restoreSession(): Promise<void>` | Restores a session after a reload. Never rejects. `DevAuthService` discards the stored token only on a 401; a network or server failure keeps it so the next reload can retry. |
| `DevAuthService` (from `@fitness-connect/auth/dev`) | Development implementation (see below). |
| `DevAuthService.login(email, password, expectedRole?): Promise<User>` | Signs in via `POST /v1/dev/login`. Throws `InvalidCredentialsError` (401), `WrongRoleError` (role differs from `expectedRole`; the rejected account is not stored and an existing session is left alone), or `ApiError`. |
| `provideDevAuth(): EnvironmentProviders` (from `@fitness-connect/auth/dev`) | Provides `DevAuthService` as `AuthService` and restores the session at startup. |
| `provideAppAuth(): EnvironmentProviders` | What the apps call. Development: `provideDevAuth()`. Production builds swap the file for `provide-app-auth.production.ts` (`fileReplacements`), which provides `UnconfiguredAuthService` (no session; `signIn` throws until the Cognito implementation exists). |
| `UnconfiguredAuthService` | Production placeholder `AuthService`. |
| `authGuard` | `CanActivateFn`. Unauthenticated users go to `/login?returnUrl=<url>`. |
| `roleGuard(role: Role): CanActivateFn` | Same redirect when the user's role differs (or nobody is signed in). |
| `authInterceptor` | `HttpInterceptorFn`. Adds `Authorization: Bearer <token>` only to URLs under `API_BASE_URL` (default `/api/v1`). |
| `TokenStorage` | Token held in memory and `sessionStorage` (`get`, `set`, `clear`). |
| `InvalidCredentialsError`, `WrongRoleError` (`expected`, `actual`) | Errors thrown by `login`. |
| `User`, `Role` | Re-exported contract types. |

## Wiring an app

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppAuth(), // dev login in development, none in production (see below)
  ],
};

// app.routes.ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('...').then((m) => m.LoginPage) },
  { path: 'dev-login', loadComponent: () => import('...').then((m) => m.DevLoginPage) },
  { path: '', canActivate: [authGuard, roleGuard('trainer')], loadComponent: () => import('...') },
];
```

- Dev-only code lives behind the `@fitness-connect/auth/dev` entry point and is reachable only from `provide-app-auth.ts` and the `dev-login` route, both of which production builds replace (see the feature-login README), so it never reaches the production bundle. Production builds will provide a Cognito-backed `AuthService` instead (later phase).
- Register `authInterceptor` with `provideHttpClient`, otherwise requests go out without a token and session restore always fails.
- Guards run after the startup `restoreSession()`, so a reload keeps the user on the page.

## Dev login page

The page injects `DevAuthService` (the only place that needs the concrete class) and calls `login`:

```ts
try {
  await devAuth.login(email, password, route.snapshot.data['expectedRole']);
  await router.navigateByUrl(returnUrl ?? '/');
} catch (e) {
  if (e instanceof InvalidCredentialsError) { /* "wrong email or password" */ }
  else if (e instanceof WrongRoleError) { /* `this account is not a ${e.expected}` */ }
  else throw e;
}
```

The landing page's "Sign in" button calls `inject(AuthService).signIn(returnUrl)`, which navigates to `/dev-login?returnUrl=...` in development.

## Interceptor and 401

A 401 on an API request while signed in is treated as an expired session: the interceptor calls `signOut()` and navigates to `/login?returnUrl=<current url>`. A 401 while signed out (for example the startup `GET /v1/me` with a stale token, which `restoreSession` handles itself) or from `POST /v1/dev/login` (wrong password) is passed to the caller untouched.

## Running unit tests

Run `pnpm nx test auth` (add `--coverage` for the 80% gate).
