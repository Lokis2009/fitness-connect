# trainer-access

Trainer approval status helpers and route guards for the trainer app. Import path: `@fitness-connect/trainer-access`. Tags: `scope:trainer`, `type:data-access`. No UI markup. It sits outside the shared `auth` library, which the client and admin apps also use.

## Public API

| Export | Description |
| --- | --- |
| `trainerStatusOf(user)` | The user's `trainerStatus`, or `null` for a signed-out user, a non-trainer or a missing field. |
| `trainerApprovedGuard` | Child guard for approved-only routes. Redirects other trainers to `/setup`. |
| `trainerSetupGuard` | Guard of `/setup`. Redirects an approved trainer to `/`. |

Status: skeleton. Every export throws `not implemented` until slice 7 of `docs/designs/trainer-home.md`.

## Running unit tests

Run `pnpm nx test trainer-access` (add `--coverage` for the 80% gate).
