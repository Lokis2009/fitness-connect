# feature-trainer-home

The trainer home page: pending booking requests and today's and tomorrow's confirmed sessions. Import path: `@fitness-connect/feature-trainer-home`. Tags: `scope:trainer`, `type:feature`. The template contains only `fc-*` components from `@fitness-connect/ui`. Design: `docs/designs/trainer-home.md`.

## Public API

| Export | Description |
| --- | --- |
| `TrainerHome` | Selector `fc-trainer-home`. Provides `RequestsStore` and `SessionsStore`. A placeholder in the skeleton. |
| `ClockService` | Server-corrected `now` signal and `sync(serverTime)`. |
| `RequestsStore`, `SessionsStore` | Page state, provided by `TrainerHome`. |
| `RequestCard`, `CardState`, `startSubmit`, `resolveSuccess`, `resolveError`, `expireCard` | Per-card state machine (pure functions). |
| `dayWindow`, `dayOf`, `hasEnded` | Day arithmetic in an IANA zone, on epoch milliseconds. |
| `refreshTrigger()`, `REFRESH_INTERVAL_MS` | Refresh events (start, tab visible, every 30 s while visible). |
| `LATE_WINDOW_MS` | 3-hour late-window constant (PDR-010). |

Status: skeleton. Everything except the constants throws `not implemented` until slice 9.

## Running unit tests

Run `pnpm nx test feature-trainer-home` (add `--coverage` for the 80% gate).
