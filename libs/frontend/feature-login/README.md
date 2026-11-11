# feature-login

The login pages shared by the client, trainer and admin apps. Import path: `@fitness-connect/feature-login`. Tags: `scope:shared`, `type:feature`. Templates contain only `fc-*` components from `@fitness-connect/ui`, and the library knows nothing about a specific app: everything app-specific comes from a `LoginConfig`.

Production uses the Cognito hosted login (D7), so `/login` is a thin landing page with a "Sign in" button. In development the button leads to `/dev-login`, an email and password form backed by `DevAuthService` (D20).

## Public API

| Export | Description |
| --- | --- |
| `LoginConfig` | `{ title: string; description?: string; expectedRole: Role; homePath: string }` |
| `loginRoutes(config): Route[]` | Route `login` (lazy `LoginPage`) and, only when `isDevMode()` is true, route `dev-login` (lazy `DevLoginPage`). Both carry the config in route `data`. |
| `LoginPage` | Selector `fc-login-page`. Heading, optional description and a "Sign in" button that calls `AuthService.signIn(returnUrl)`. Already signed in with `expectedRole`: redirects to the return URL instead of rendering. |
| `DevLoginPage` (not exported) | Selector `fc-dev-login-page`. Signal Forms form (email, password) that calls `DevAuthService.login(email, password, expectedRole)`. Only reachable through the lazy `dev-login` route, so production builds can leave it out. |

`returnUrl` comes from the query string and defaults to `homePath`. Only values that start with a single `/` are accepted (no `//host`, `/\host`, absolute URLs or whitespace), so a crafted link cannot redirect users to another site.

`DevLoginPage` messages: `InvalidCredentialsError` shows "Invalid email or password", `WrongRoleError` shows "This account cannot sign in to the <role> app", anything else shows "Something went wrong. Please try again." Field errors appear only after the field was touched or a submit was attempted. The submit button shows a spinner and a second submit is ignored while a request is in flight. Errors are rendered in an `fc-alert` (`role="alert"`); fields stay enabled so focus is never lost.

## Wiring an app

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppAuth(), // dev login in development, none in production, see "Production builds"
  ],
};

// app.routes.ts
export const routes: Routes = [
  ...loginRoutes({
    title: 'Trainer sign in',
    description: 'Manage your clients and sessions.',
    expectedRole: 'trainer',
    homePath: '/',
  }),
  { path: '', canActivate: [authGuard, roleGuard('trainer')], loadComponent: () => import('./home') },
  { path: '**', redirectTo: '' },
];
```

The pages inject `AuthService` (landing page) and `DevAuthService` (dev page). `provideDevAuth()` maps `AuthService` to `DevAuthService`, so both resolve to the same instance. `authGuard` and `roleGuard` redirect to `/login?returnUrl=...`, which this library's landing page understands.

## Production builds and the dev page

Production builds contain no dev login. Each app's `build` target has a `production` configuration with two `fileReplacements`:

| Replaced | With | Effect |
| --- | --- | --- |
| `libs/frontend/auth/src/lib/provide-app-auth.ts` | `provide-app-auth.production.ts` | `provideAppAuth()` provides `UnconfiguredAuthService` instead of `DevAuthService` |
| `libs/frontend/feature-login/src/lib/dev-login-routes.ts` | `dev-login-routes.production.ts` | `devLoginRoutes()` returns no routes, so the `dev-login` route and its lazy chunk are gone |

Dev-only code is reachable only through those two files: `DevAuthService` and `provideDevAuth()` live behind the `@fitness-connect/auth/dev` entry point, and `DevLoginPage` is not exported from this library. After a production build the output must not contain `DevAuth` or `dev-login` (`pnpm check:prod-bundles` checks this).

In development, `devLoginRoutes()` still checks `isDevMode()` before it adds the route. The real production sign-in (Cognito hosted login, D7) replaces `UnconfiguredAuthService`; until then the landing page's "Sign in" button throws "not implemented".

## Running unit tests

Run `pnpm nx test feature-login` (add `--coverage` for the 80% gate).
