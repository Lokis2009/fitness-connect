# feature-login

The login pages shared by the client, trainer and admin apps. Import path: `@fitness-connect/feature-login`. Tags: `scope:shared`, `type:feature`. Templates contain only `fc-*` components from `@fitness-connect/ui`, and the library knows nothing about a specific app: everything app-specific comes from a `LoginConfig`.

Production uses the Cognito hosted login (D7), so `/login` is a thin landing page with a "Sign in" button. In development the button leads to `/dev-login`, an email and password form backed by `DevAuthService` (D20).

## Public API

| Export | Description |
| --- | --- |
| `LoginConfig` | `{ title: string; description?: string; expectedRole: Role; homePath: string }` |
| `loginRoutes(config): Route[]` | Route `login` (lazy `LoginPage`) and, only when `isDevMode()` is true, route `dev-login` (lazy `DevLoginPage`). Both carry the config in route `data`. |
| `LoginPage` | Selector `fc-login-page`. Heading, optional description and a "Sign in" button that calls `AuthService.signIn(returnUrl)`. Already signed in with `expectedRole`: redirects to the return URL instead of rendering. |
| `DevLoginPage` | Selector `fc-dev-login-page`. Signal Forms form (email, password) that calls `DevAuthService.login(email, password, expectedRole)`. |

`returnUrl` comes from the query string and defaults to `homePath`. Only values that start with a single `/` are accepted (no `//host`, `/\host`, absolute URLs or whitespace), so a crafted link cannot redirect users to another site.

`DevLoginPage` messages: `InvalidCredentialsError` shows "Invalid email or password", `WrongRoleError` shows "This account cannot sign in to the <role> app", anything else shows "Something went wrong. Please try again." Field errors appear only after the field was touched or a submit was attempted. The submit button shows a spinner and a second submit is ignored while a request is in flight. Errors are rendered in an `fc-alert` (`role="alert"`); fields stay enabled so focus is never lost.

## Wiring an app

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideDevAuth(), // development only, see "Production builds"
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

`loginRoutes` adds `dev-login` only when `isDevMode()` is true. In a production build `isDevMode()` returns `false` at runtime, so the route is never registered and `/dev-login` does not match anything.

That is a runtime guarantee, not dead-code elimination. `isDevMode()` is a function call, so the bundler cannot prove the branch is dead, and the `import('./dev-login-page')` stays in the build as a lazy chunk that is never requested. That chunk also pulls in `DevAuthService` from `@fitness-connect/auth`. To keep the dev code out of the bundle completely, additionally:

- provide `provideDevAuth()` only from a development configuration (a `fileReplacements` entry for a dev-only `app.config` file, or a separate build configuration), and
- check the production output for the dev chunk (for example by searching for `dev-login` in `dist/`).

`DevAuthService` is also only instantiated when somebody injects it, so a production build that does not call `provideDevAuth()` never creates it, and the API's dev login endpoint does not exist in production either (D20).

## Running unit tests

Run `pnpm nx test feature-login` (add `--coverage` for the 80% gate).
