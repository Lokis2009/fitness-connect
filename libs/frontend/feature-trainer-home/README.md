# feature-trainer-home

The trainer home page: pending booking requests and today's and tomorrow's confirmed sessions. Import path: `@fitness-connect/feature-trainer-home`. Tags: `scope:trainer`, `type:feature`. The template contains only `fc-*` components from `@fitness-connect/ui`. Design: `docs/designs/trainer-home.md`. It reads data through `data-access`, user and sign-out through `auth`, and the approval status through `trainer-access`. It may not depend on other feature libs, and it takes every clock reading from `ClockService`, not from `Date.now()`.

## Public API

| Export | Description |
| --- | --- |
| `TrainerHome` | Selector `fc-trainer-home`. The page: header with Sign out, the deep-link notice, the booking requests with Accept and Decline, and the sessions of today and tomorrow. Provides `RequestsStore` and `SessionsStore`. |
| `ClockService` | Server-corrected `now` signal and `sync(serverTime)`. |
| `RequestsStore`, `SessionsStore` | Page state, provided by `TrainerHome`. `RequestsStore.acceptedCount` counts accepted answers, and `SessionsStore.refreshAfterAccept()` loads the sessions again after one, queued behind any request in flight. |
| `RequestCard`, `CardState`, `startSubmit`, `resolveSuccess`, `resolveError`, `expireCard` | Per-card state machine (pure functions). |
| `dayWindow`, `dayOf`, `hasEnded` | Day arithmetic in an IANA zone, on epoch milliseconds. |
| `refreshTrigger()`, `REFRESH_INTERVAL_MS` | Refresh events (start, tab visible, every 30 s while visible). |
| `LATE_WINDOW_MS` | 3-hour late-window constant (PDR-010). |

## Running unit tests

Run `pnpm nx test feature-trainer-home` (add `--coverage` for the 80% gate).
