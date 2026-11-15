# trainer-access

Trainer approval status helpers and route guards for the trainer app. Import path: `@fitness-connect/trainer-access`. Tags: `scope:trainer`, `type:data-access`. No UI markup. It sits outside the shared `auth` library, which the client and admin apps also use.

## Public API

| Export | Description |
| --- | --- |
| `trainerStatusOf(user)` | The user's `trainerStatus`, or `null` for a signed-out user, a non-trainer or a missing field. |
| `trainerApprovedGuard` | Child guard for approved-only routes. Redirects other trainers to `/setup`. |
| `trainerSetupGuard` | Guard of `/setup`. Redirects an approved trainer to `/`. |

Both guards are synchronous and read `AuthService.user()`. A signed-out user or a non-trainer goes to `/login?returnUrl=<requested url>`, as `authGuard` does. Design: `docs/designs/trainer-home.md`.

## Running unit tests

Run `pnpm nx test trainer-access` (add `--coverage` for the 80% gate).
