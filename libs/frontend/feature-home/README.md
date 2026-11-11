# feature-home

The signed-in landing page shared by the client, trainer and admin apps. Import path: `@fitness-connect/feature-home`. Tags: `scope:shared`, `type:feature`. The template contains only `fc-*` components from `@fitness-connect/ui`.

## Public API

| Export | Description |
| --- | --- |
| `SignedInHome` | Selector `fc-signed-in-home`. Greets the user ("Welcome, <name>"), confirms the session with `GET /v1/me`, shows email and role, and offers "Sign out" (clears the session and goes to `/login`). |

It is a placeholder for the real per-app features. Each app routes its guarded root path to it:

```ts
{
  path: '',
  canActivate: [authGuard, roleGuard('trainer')],
  loadComponent: () =>
    import('@fitness-connect/feature-home').then((m) => m.SignedInHome),
}
```

A 401 from the session check is handled by the auth interceptor; any other failure shows "We could not confirm your session. Please try again later."

## Running unit tests

Run `pnpm nx test feature-home` (add `--coverage` for the 80% gate).
