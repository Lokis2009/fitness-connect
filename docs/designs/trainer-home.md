# Trainer home screen

*   **Author:** Stanislav Blokh
*   **Status:** Draft
*   **Date:** 2026-11-15

--------------------------------------------------------------------------------

## Overview

The trainer home screen is the first product screen in `apps/trainer-web`. Today `/` shows a greeting and a sign-out button (`SignedInHome`, shared by the client, trainer and admin apps).

The new home is for trainers an admin has approved (PDR-009). It shows two lists:

1.  **Booking requests waiting for an answer.** Each card shows the client's name, the session date and time, the price, the venue and the deadline. A request expires 1 hour after the client submits it (PDR-006). The trainer accepts or declines on the card with one tap and no reason. The email alert (PDR-012) links to the request on this screen.
2.  **Confirmed sessions for today and tomorrow**, in the venue's time zone (PDR-019).

A trainer who is not approved does not see home. A separate URL, `/setup`, shows their verification status. A guard sends non-approved trainers from `/` to `/setup`, and approved trainers from `/setup` back to `/`.

Home is the starting point of the trainer app. It has no metric of its own. The PRD already measures request response time and expiry rate (section 9), and home exists to move those numbers.

## The Problem

A trainer has 1 hour to answer a booking request. If they miss it, the request expires and the client has to start over. The PRD requires an email and an in-app alert for each request (PDR-012), but the trainer app has no screen that can show a request.

Three gaps follow from that:

*   **No place to answer.** There is no list of pending requests and no accept or decline action.
*   **No in-app alert.** The pending list is the only in-app surface. If it doesn't refresh on its own, a trainer with the tab open sees nothing while the clock runs.
*   **No way to tell trainers apart.** Anyone with the trainer role reaches `/`, whether or not an admin has approved them. The guards read only the role from the token. The API has no approval status, and no bookings, venue or time zone data.

The proposed solution is a trainer-only home that lists pending requests first, then confirmed sessions for today and tomorrow. It refreshes on its own so it works as the in-app alert. A guard and a read-only `/setup` page separate approved trainers from the rest. Accept and decline are decided by the server, so a race with expiry, withdrawal or another acceptance always has one clear outcome.

## Goals

*   An approved trainer sees pending booking requests first, each with client name, session date and time with zone, price, venue and deadline, sorted by soonest deadline.
*   An approved trainer can accept or decline a request on its card with one tap each and no reason. Both outcomes, and each way a race can end (already expired, withdrawn or decided), show a distinct result on the card without a reload.
*   The pending list works as the in-app alert. It refetches when the tab regains focus and on a regular interval while visible, so a new request appears without a manual reload.
*   An approved trainer sees confirmed sessions for today and tomorrow in the venue's time zone, with the zone shown. A session that has ended no longer appears, and one in progress stays until it ends.
*   Both lists have loading, empty and error states. A failed fetch never looks like an empty list.
*   The email alert links to a specific request on home. A signed-out trainer who opens the link signs in and lands on that request. An expired, answered or foreign request shows an inline notice, not a blank page.
*   A trainer who is not approved can reach only `/setup`, which shows their verification status. The API enforces approval on its own, and the client guard is only a better screen.
*   The contract (approval status, pending and confirmed lists, accept and decline outcomes) is defined first, then the API stubs, shared UI components, data access, guard and home, following the repo workflow (skeleton, failing test, implementation).

## Non-Goals

*   Stats, earnings, reviews, a calendar view, notification history and past sessions.
*   Cancel and record completion. Both come later. A session that has passed and was never recorded does not appear on home.
*   Profile, venue and verification-submission screens, and navigation to any screen that does not exist yet. `/setup` is read-only.
*   Client chat or contact.
*   A home-specific success metric.
*   WebSockets and push notifications.
*   Any recording beyond the PRD's status changes with timestamps. Alert sent or failed, `firstViewedAt` and the decision channel are not recorded, so the expiry rate cannot be read against alert delivery.
*   An undo toast or an extra confirm tap on accept.

## Open Questions

*   **Card fields (O7, O9, O12)**: Which client information is shown beyond the name, what currency and venue-entry cost the price includes, and whether each trainer has one venue (which makes the venue on every card redundant)? The card field set is provisional until these are decided.
*   **Approved but not bookable**: A newly approved trainer still has to publish availability and price, so home shows two empty lists. Proposed: static copy that explains this, with no link to a screen that does not exist. Not decided.
*   **Routes reachable while unapproved**: Which routes besides `/setup` stay open to an unapproved trainer (profile and venue screens, once they exist)? Proposed: an explicit allow-list, with every other route behind the approval guard. Not decided.
*   **Release gate**: Home must not ship to real users before cancel and record completion exist. PRD acceptance item 10 cannot pass without a recording path. Confirm this as a rule.
*   **Production sign-in and the deep link**: The dev login keeps the query string through `returnUrl` (checked in `auth-guards.ts` and `return-url.ts`). The production Cognito sign-in does not exist yet. When it is built, it must keep `/?request=<id>` through the hosted login redirect.
*   **More than one venue (O12)**: The client computes the day window from one venue time zone, which `getMe` returns. If a trainer can have several venues, that rule must change. This design assumes one venue per trainer.
*   **Desktop column width**: The mockup shows one centered column about 958 px wide in a 1706 px frame. The design uses a 960 px token, which assumes the frame is 1x. If it is 2x, the column is about 480 px. The design owner should confirm before the token is added.
*   **Client cancellation**: A client can cancel a confirmed session (PDR-010), which removes the row. Should home show "Cancelled by client" for today and tomorrow, or rely on refresh and on the notification rules (O6)?

## Critical User Journeys (CUJs)

### CUJ 1: Answer a request from the email

*   **Given**: An approved trainer is signed in. A client has submitted a request 5 minutes ago, and the trainer received the email.
*   **When**: The trainer opens the link in the email.
*   **Then**: Home opens with that request highlighted. It shows client name, date and time with zone, price, venue and the time left. Tapping Accept confirms the booking and the card shows the result. The session appears under today or tomorrow if it falls in that window.

### CUJ 2: Open the email link while signed out

*   **Given**: An approved trainer has no active session.
*   **When**: The trainer opens the email link.
*   **Then**: They sign in and land on home with the same request highlighted. If the request has expired, been answered or belongs to someone else, home shows a notice that says so, and the lists load as normal.

### CUJ 3: A request arrives while home is open

*   **Given**: An approved trainer has home open in a visible tab.
*   **When**: A client submits a request.
*   **Then**: Within the refresh interval the request appears in the pending list without a reload. If the tab was in the background, the list refreshes when the tab regains focus.

### CUJ 4: A request is lost to a race

*   **Given**: A request is pending and the trainer is about to answer.
*   **When**: The request expires or the client withdraws before the tap lands, and the trainer taps Accept.
*   **Then**: The server rejects the call. The card shows that the request is no longer available. It does not show a generic error, and no booking is created.

### CUJ 5: A late-window request

*   **Given**: A pending request is for a session that starts within 3 hours of now.
*   **When**: The trainer views the card.
*   **Then**: The card shows a caption that cancelling later will be flagged. Accept still commits on one tap.

### CUJ 6: Check today's schedule

*   **Given**: An approved trainer has confirmed sessions today and tomorrow.
*   **When**: The trainer opens home.
*   **Then**: Sessions show in the venue's time zone with the zone label, soonest first. A session that has ended is not shown, and one in progress is shown until it ends. With none, the list shows an empty state.

### CUJ 7: A trainer who is not approved signs in

*   **Given**: A trainer has not yet been approved. Their status is incomplete, submitted or changes requested.
*   **When**: The trainer signs in or opens `/`.
*   **Then**: They are sent to `/setup`, which shows their status and, for changes requested, the admin's reason. It links to no missing screen. When an admin approves them, the next status check moves them to home.

### CUJ 8: The status check fails

*   **Given**: A trainer is on `/setup` and asks for a status refresh, or home gets a 403 saying the trainer is not approved.
*   **When**: The refresh request fails or times out.
*   **Then**: The page shows an error with a retry and keeps the last known status. It does not move the trainer to home on a failed check. If the app cannot load the user at startup, the existing sign-in flow applies.

## Technical Plan (Architecture)

### Decisions this plan rests on

| # | Decision | Source |
|---|---|---|
| 1 | The first slice has everything: pending list, confirmed list, approval guard and read-only `/setup`. | Author, `/egm-draft` |
| 2 | Approval status is a flat field on `getMe` (`trainerStatus`). The admin's note and the venue time zone are two more flat fields (`trainerStatusNote`, `trainerVenueTimeZone`). | Author, `/egm-draft` |
| 3 | Two list endpoints: pending requests, and confirmed sessions with a `from` and `to`. | Author, `/egm-draft` |
| 4 | The client computes the "today and tomorrow" window in the venue's time zone. | Author, `/egm-draft` |
| 5 | Accept is one tap with a caption on late-window cards. | Author, `/egm-draft` |
| 6 | The email link goes to `/?request=<id>`. | Author, `/egm-draft` |
| 7 | Nothing is recorded beyond status changes with timestamps. | Author, `/egm-draft` |
| 8 | The approval guard is synchronous. It reads `trainerStatus` from the user the app loaded at startup. | Author, reconciliation with the brief |
| 9 | Home lists confirmed sessions that have not ended. A session in progress stays until it ends. | Author, reconciliation with the brief |
| 10 | Each e2e test creates its own bookings through the database. The dev seed is for manual use. | Author, Stage 9 review |
| 11 | `booking` gets client names and venues through public lookups of `identity` and `trainers`, not by reading their tables. | Author, Stage 9 review |
| 12 | The UI mockups (list states, request card states, phone and desktop home) are the source for layout and copy. The venue's city names the time zone ("Warsaw time"). Empty, error and notice panels are a new `fc-state` component, and `fc-alert` is not restyled. The desktop column is 960 px wide, pending confirmation from the design owner. | Author, mockup review |

### What exists today

*   `AuthService.user` is filled by `GET /v1/me` in an app initializer before the router starts (`provide-dev-auth.ts`). Guards read it synchronously.
*   The API has `health`, `me` and `dev/login`. The database has `users` and `dev_credentials`. There are no trainer, venue or booking tables.
*   `Problem` always has `type: about:blank`, so the client cannot tell one 409 from another.
*   The trainer app's `/` renders the shared `SignedInHome` placeholder. The e2e suite expects its greeting.
*   Shared UI has `fc-page`, `fc-card`, `fc-stack`, `fc-heading`, `fc-text`, `fc-alert`, `fc-button` (primary, secondary, text, with a loading state) and the form components. `fc-page` centers its content, which suits a login card and not a list.

### Overview of the change

```text
 Email link  /?request=<id>
        |
        v
 trainer-web routes
   /setup  [authGuard, roleGuard(trainer), trainerSetupGuard]  -> feature-trainer-setup
   /       [authGuard, roleGuard(trainer), trainerApprovedGuard] -> feature-trainer-home
        |                                   ^
        | reads auth.user().trainerStatus   | refreshUser() on 403 / on /setup
        v                                   |
 AuthService (user signal from GET /v1/me) -+

 feature-trainer-home
   RequestsStore --poll 30 s + on focus--> GET /v1/trainers/me/booking-requests
   SessionsStore --same refresh----------> GET /v1/trainers/me/sessions?from&to
   Accept / Decline ---------------------> POST /v1/bookings/{id}/accept | /decline
   ClockService (server-time offset, 1 s tick) drives deadlines and the late caption

 API
   MeController          -> TrainersService (status + venue time zone)
   TrainerBookingsController -> BookingService (lists, accept, decline) -> Postgres
```

### Contract (`libs/shared/api-contract`, written first)

`GET /v1/me` returns `User`, which gains three optional, nullable fields. All three are `null` for clients and admins, and none is in `required`, so existing clients and test fixtures still compile.

```text
User.trainerStatus:         null | 'incomplete' | 'submitted' | 'changes_requested' | 'approved'
User.trainerStatusNote:     null | string   // the admin's reason, set when changes are requested
User.trainerVenueTimeZone:  null | string   // IANA zone of the trainer's venue, for example Europe/Warsaw
```

New operations. All need a trainer token. Unapproved trainers get 403 with code `trainer-not-approved`.

| Operation | Path | Result |
|---|---|---|
| `listBookingRequests` | `GET /v1/trainers/me/booking-requests` | `{ serverTime, items: BookingRequest[] }`: only requests with status pending and `expiresAt` after the server's now, soonest `expiresAt` first. |
| `listSessions` | `GET /v1/trainers/me/sessions?from=&to=` | `{ serverTime, items: Session[] }`: confirmed bookings that overlap the range `[from, to)` (`startsAt` before `to` and `startsAt` plus duration after `from`), soonest first. A session that started before `from` and is still running is returned, and the client hides ended ones. `from` and `to` are full ISO 8601 date-times with `Z` or an offset, `from` is before `to`, and the span is at most 7 days, otherwise 400. |
| `acceptBooking` | `POST /v1/bookings/{id}/accept` | 200 with the updated `Booking`. |
| `declineBooking` | `POST /v1/bookings/{id}/decline` | 200 with the updated `Booking`. |

```text
BookingRequest: { id, clientName, startsAt, durationMinutes, priceMinor, currency,
                  venue: { name, area, timeZone }, requestedAt, expiresAt }
Session:        { id, clientName, startsAt, durationMinutes,
                  venue: { name, area, timeZone } }
Booking:        { id, status, startsAt, decidedAt }
```

Rules that follow from the PRD and decision log:

*   The pending payload has the venue name and area only. The exact address is not in any payload this feature sends (PDR-013).
*   Money is an integer in minor units plus a currency code (Architecture 6.5).
*   `serverTime` is the database `clock_timestamp()` read by the first query of the request. The client never uses its own clock as the source of truth for a deadline.
*   Accept and decline are idempotent for the same caller and action. A repeat returns 200 with the current booking.
*   A 404 covers "no such booking", "not your booking" and a malformed id, so ids cannot be probed. The action contracts have no 400, in line with `users.repository.ts`, which treats a malformed id as not found.
*   `Problem` gains an optional `code` field (an extension member allowed by RFC 9457). Codes used here: `trainer-not-approved` (403), `booking-expired` (409), `booking-withdrawn` (409) and `booking-not-pending` (409, for any other status, such as an accept after a decline). The contract describes the codes in text and does not make them an enum, so a new code needs no contract change.
*   The new schemas use only the keywords that `apps/api/src/testing/json-schema.ts` supports. Extending that validator is out of scope. For the same reason `User.trainerStatus` inlines the four status values plus `null` instead of referencing `TrainerStatus` (the validator has no `oneOf`, so it cannot express a nullable reference). `contract.int.spec.ts` fails if the two lists differ.
*   The ids in `/?request=<id>` are booking ids. A link to a booking that is not this trainer's pending request is a dead link (see "Deep link").

### Data model (Drizzle, one new migration)

All tables use `id uuid primary key default gen_random_uuid()` unless noted, and timestamps are `timestamptz`. Enum values are literal lists in the schema files, as in `schema/users.ts`, because drizzle-kit loads schema files without path aliases.

| Table | Columns | Notes |
|---|---|---|
| `trainer_profiles` | `user_id uuid` (PK, references `users` on delete cascade), `status` (enum `trainer_status`: incomplete, submitted, changes_requested, approved; not null, default `incomplete`), `status_note text` (null), `created_at`, `updated_at` (both not null, default now) | One row per trainer. A missing row reads as `incomplete`. Admin approval and the profile screens write to it later. |
| `venues` | `trainer_user_id` (references `users` on delete cascade, not null), `name`, `area`, `address` (text, not null), `instructions` (text, null), `time_zone` (text, not null, an IANA name), `created_at` | Index on `trainer_user_id`. No unique constraint: one venue per trainer is an assumption (O12), not an approved rule, so the oldest venue by `created_at` is used. It moves into the `locations` module when that exists. |
| `bookings` | `trainer_user_id`, `client_user_id` (both reference `users`, not null), `venue_id` (references `venues`, not null), `starts_at` (not null), `duration_minutes integer` (check > 0), `price_minor integer` (check >= 0), `currency char(3)`, `status` (enum `booking_status`: pending, confirmed, declined, expired, withdrawn, cancelled, completed; default `pending`), `requested_at` (not null), `expires_at` (not null, check > `requested_at`), `decided_at` (null), `created_at` | `expires_at` is set to `requested_at` plus 1 hour when a request is created. Indexes: `(trainer_user_id, status, expires_at)`, `(trainer_user_id, status, starts_at)` and `(client_user_id, status)`. |
| `booking_status_changes` | `booking_id` (references `bookings` on delete cascade, not null), `from_status` (null on creation), `to_status` (not null), `changed_at` (not null, default now) | Index on `booking_id`. The history PRD section 6 requires. It stores no actor and no reason (not approved). |

The migration is generated with `drizzle-kit generate --name trainer_home`, after checking the flag with `--help`, instead of generating a file and renaming it, which would break the `_journal.json` tag.

This feature does not create bookings. The client request flow does, and it adds the no-overlap constraint (Architecture 6.1). Development data comes from the seed.

### Backend behavior

*   **Approval check.** A `TrainerApprovedGuard` in the new `trainers` lib reads the caller's profile. It answers 403 `trainer-not-approved` unless the status is `approved`. The two list endpoints and both actions use it, so the API enforces approval whatever the browser does.
*   **Pending list.** One query filters on `status = 'pending' AND expires_at > now()`. It does not depend on any job that moves overdue requests to `expired` (PRD section 11).
*   **Other modules' data.** `booking` does not read the `users` or `venues` tables. `BookingService` asks `IdentityModule` for client display names and `TrainersService` for venues, in one batched call each, and merges them in memory (Architecture section 4: cross-module calls go through public APIs). A row the lookups miss does not fail the list: a missing client name shows as "Unknown client", so the request can still be answered, and a row without a venue is left out. Both are logged as errors.
*   **Accept and decline** run in one transaction owned by the repository's `decide` method, at the default `READ COMMITTED` isolation:
    1.  Read the target booking's client without a lock, matched on id and the caller as trainer. None found, or a malformed id: 404.
    2.  Lock all of that client's pending bookings in one statement, ordered by `id`, so every caller locks in the same order and two trainers cannot deadlock. Re-read the target after the lock.
    3.  Decide from the target's status, using `clock_timestamp()` as "now", which stays correct after a lock wait: see the decision table in the Detailed Implementation Plan. A pending request whose session has already started (`starts_at <= now`) cannot be accepted, even inside its response window: it answers 409 `booking-expired`, and nothing is withdrawn. It can still be declined. A repeat of the same action returns 200. Conflicts are 409 `booking-expired`, `booking-withdrawn` or `booking-not-pending`.
    4.  Write the new status, `decided_at` and a history row.
    5.  Accept only: withdraw the client's other locked pending bookings whose time overlaps this session, each with a history row (PDR-018). Ranges are half-open `[starts_at, starts_at + duration)`, so touching sessions do not overlap. Rows past their deadline are left alone. The client notice itself comes with the notifications feature.
*   **Logging.** Each accept or decline logs one structured line (Nest `Logger('BookingService')`, JSON with the booking id, trainer id, action, result, seconds left to the deadline and minutes until the session starts). The time is the database time of the decision (`decide` returns it, and the 409 exception carries it), not the API host clock. `result` is `ok`, `repeat`, the 409 code, or `not-found` for a 404. A 403 from the approval guard logs `{ event: 'trainer.rejected', trainerId, code: 'trainer-not-approved' }` at `log` level (`trainerId` is `null` when the request has no user).
*   **A job that moves overdue requests to `expired`, and the request-creation email, are not part of this feature.** Home works without the job. The email sender must use the link format below.

### Frontend design

**Libraries** (Nx tags in brackets):

| Library | Purpose |
|---|---|
| `libs/frontend/trainer-access` (`scope:trainer`, `type:data-access`) | `trainerApprovedGuard`, `trainerSetupGuard` and a helper that reads `auth.user().trainerStatus`. It sits outside the shared auth lib, which other apps use, and uses the `data-access` type because `auth` has that tag. |
| `libs/frontend/feature-trainer-home` (`scope:trainer`, `type:feature`) | The home page, its two stores, the clock service and the deep-link handling. |
| `libs/frontend/feature-trainer-setup` (`scope:trainer`, `type:feature`) | The read-only `/setup` page. Features may not depend on features, so the two share only `trainer-access`. |
| `libs/frontend/feature-home` | Not changed. It stays the placeholder for the client and admin apps. |

**Guards** (synchronous, reading `auth.user()`). Because the two statuses are exclusive, the guards cannot loop, and a test table proves it.

| Signed-in user | Opens `/` | Opens `/setup` |
|---|---|---|
| Signed out or not a trainer | `/login?returnUrl=...` | `/login?returnUrl=...` |
| Trainer, status `approved` | home | redirect to `/` |
| Trainer, status incomplete, submitted or changes requested | redirect to `/setup` | `/setup` |
| Trainer, `trainerStatus` null or missing | redirect to `/setup` | `/setup` |

The `**` route redirects to `''`. Approved-only routes sit under one parent route: `''` with `canActivate: [authGuard, roleGuard('trainer')]`, `canActivateChild: [trainerApprovedGuard]` and one child that loads `TrainerHome`. `setup` has its own guard list. Routes reachable while unapproved are an explicit list, which is `/setup` only for now. The API always sets `trainerStatus` for trainers, so `null` means an unknown state, and `/setup` with its "Check again" button is where it resolves.

**Keeping status current.** `AuthService` gains `refreshUser()`, which reloads `GET /v1/me` into the `user` signal. It is called on entering `/setup`, from a "Check again" button there, and when home gets a 403 `trainer-not-approved`. A 401 during the refresh is handled by the auth interceptor, so the method only rethrows. After a refresh on `/setup` returns `approved`, the page navigates to `/`. After a refresh on home returns a status that is not `approved`, the store navigates to `/setup`. If it is still `approved`, the 403 was unexpected and the card shows the error. Navigating to the same URL is not needed, so no router settings change. A failed refresh leaves the last status and shows an error with a retry.

**Home page.**

*   `RequestsStore` and `SessionsStore` each hold `data`, `loading`, `error` and `lastUpdated` signals. Loading, empty and error are separate states: loading shows skeleton cards (`fc-skeleton`), and empty and error show `fc-state` panels with the copy in "Page copy". A failed refresh keeps the last list and shows "Could not refresh. Showing the update from HH:mm". With no earlier data it shows an error with a retry. It never shows the empty state.
*   **Refresh.** On open, when the tab becomes visible, and every 30 seconds while visible (a constant, `REFRESH_INTERVAL_MS`). It pauses while hidden. This list is the in-app alert required by PDR-012.
*   **Clock.** `ClockService` keeps `offset = serverTime - (the middle of the request round trip)` from each response: a store stamps the send time with `deviceNow()` and passes it to `sync(serverTime, sentAt)`, because the server read its time somewhere between sending and arrival, so using the arrival time would leave the clock behind the server by the latency and exposes a `now` signal that ticks once a second. Other code in the library takes `now` from it, and `clock-source.spec.ts` scans the library sources and fails if any file except `clock.service.ts` calls `Date.now()` or `new Date()` with no argument. Deadlines, expiry and the late-window caption use it, so a wrong device clock does not change them.
*   **Request card** (built from `fc-card`, `fc-stack`, `fc-heading`, `fc-text`, `fc-badge`, `fc-time`, `fc-deadline` and `fc-button`), from top to bottom: the client name (`h3`); the date and time in bold, with "Today," or "Tomorrow," for those days ("Today, 16:00 Warsaw time"); a muted line with the price and the venue name ("120 PLN · Iron Hall Gym"); "Respond by 14:30 (Warsaw)" with a badge "37 min left"; and one row with Accept (primary) and Decline (secondary) at equal width and 48 px height. Duration and venue area are in the payload but not shown. The price is `priceMinor` divided by 100, without decimals when whole and with two when not, followed by the currency code. It assumes two decimals for every currency, because O7 is open and PLN is the only currency in view.
*   **Late-window caption.** When `startsAt - now` is under 3 hours, the card adds: "Session starts within 3 hours. Cancelling later will be flagged." Accept still commits on one tap. The 3-hour constant (`LATE_WINDOW_MS`) has one definition, in `late-window.ts`, with a comment citing PDR-010.
*   **Per-card state** is a small state machine:

    | State | Event | Next state |
    |---|---|---|
    | `idle` | tap Accept or Decline | `submitting` (the action is kept) |
    | `idle` | the clock reaches `expiresAt` | `expired` (a disabled card; the store refetches once) |
    | `submitting` | 200 | `accepted` or `declined` (the result is kept) |
    | `submitting` | 409 `booking-expired` | `unavailable`, reason `expired` (the store refetches once) |
    | `submitting` | 409 `booking-withdrawn` | `unavailable`, reason `withdrawn` (the store refetches once) |
    | `submitting` | 409 `booking-not-pending`, or 404 | `unavailable`, reason `answered` (the store refetches once). A 404 hides whether the id is unknown or another trainer's, and "already answered" is the least misleading text. |
    | `submitting` | 403 `trainer-not-approved` | `refreshUser()`, then navigate to `/setup` unless the status is still `approved`, in which case `failed` |
    | `submitting` | network error or 5xx | `failed` (an error box with the message in "Page copy" and a Retry button; both buttons enabled) |
    | `failed` | tap Retry | `submitting` (the kept action again) |
    | `failed` | tap Accept or Decline | `submitting` (that action) |
    | `accepted`, `declined`, `unavailable`, `expired` | none | stay until the page is left |

    A 401 follows the existing interceptor flow, and the card stays visible. A repeat of the same action is safe because of idempotency. The card looks like this in each state:

    *   **`submitting`:** the card is unchanged. The pressed button shows a spinner with the label "Accepting" or "Declining" (`fc-button` `loadingLabel`), and the other button is disabled.
    *   **`accepted` and `declined`:** a compact card with the client name and a badge ("Accepted" or "Declined"), and one sentence ("Accepted. Tue 17 Nov, 10:00 Warsaw time." or "Declined. No reason was sent.").
    *   **`unavailable`:** a compact card with the client name, the badge "No longer available" and one sentence by reason: "This request expired before you answered.", "The client withdrew this request." or "This request was already answered."
    *   **`expired`:** the card keeps its details, the badge "Expired" replaces the time-left badge, the text "The 1-hour response window has ended." is added above the buttons, and both buttons are disabled. A disabled Accept looks outlined, as the Material theme renders a disabled filled button.
    *   **`failed`:** the card keeps its details and time-left badge, adds an error box with "We could not reach the server. Your answer may not have been saved." and a Retry button, and leaves Accept and Decline enabled.
*   **Store rules.** `RequestsStore` keeps a map keyed by booking id. A poll merges by id: a card in `submitting` keeps its state and the response is not applied to it, resolved cards (`accepted`, `declined`, `unavailable`, `expired`) stay in place even after the server list drops them, and new ids are added as `idle`. Order is by `expiresAt`, with resolved cards after open ones. Refresh uses `exhaustMap`, so a trigger while a request is in flight is ignored. The store triggers one refetch per card at the deadline and after a 409. Both stores are provided in `TrainerHome`'s `providers`, so they live until the page is left. `SessionsStore` handles a 403 `trainer-not-approved` the same way. An accepted request becomes a confirmed session, so `RequestsStore` counts accepted answers (`acceptedCount`) and `TrainerHome` calls `SessionsStore.refreshAfterAccept()` for each one. That refresh queues behind a request already in flight, because that request may predate the accept. Polls and manual refreshes are still dropped while a request is in flight or waiting. The same queued refresh is used after an unavailable answer and when a card reaches its deadline, because a poll in flight may predate either change (`RefreshQueue` in `refresh-queue.ts` holds these rules for both stores).
*   **Confirmed sessions.** `SessionsStore` computes `from` as the start of today and `to` as the end of tomorrow in `trainerVenueTimeZone`, with pure functions that take epoch milliseconds and a zone: `dayWindow(now, zone)`, `dayOf(startsAt, zone, now)` (`today`, `tomorrow` or `null`) and `hasEnded(startsAt, durationMinutes, now)` (true when `startsAt` plus duration is at or before `now`). The start of a local date is the earliest instant whose local date is that date. It is found with `Intl.DateTimeFormat(..., { timeZone }).formatToParts`, searching 14 hours either side of UTC midnight, so a day without a local 00:00 (a DST gap) starts at the first instant that exists. No date library is added. The functions are tested for DST changes, a zone whose midnight does not exist, a 00:30 local session that falls on another UTC day, and a session ending exactly at `now`. A session that started before `from` and is still running is returned by the endpoint and shown. The store hides a session once `startsAt` plus its duration has passed, using `ClockService.now`, and keeps returning the same list objects while the sessions on show do not change (a computed with an identity comparison), so the page does not re-render every second as the clock ticks; the "Today" heading takes the start of the venue day, not the clock, for the same reason, so ended sessions leave the list without a refetch and a session in progress stays until it ends. If `trainerVenueTimeZone` is `null`, or is not a zone `Intl` knows (`isValidTimeZone`; the zone is stored text, and a typo would make the day arithmetic throw), the list shows an error, not an empty state, and the subtitle is hidden. `fc-time` and `fc-deadline` format in UTC, and say so, when a zone id is not valid. The list has the section title "Today and tomorrow" (`h2`), then day groups headed "Today, Sun 15 Nov" and "Tomorrow, Mon 16 Nov" (`h3`, `fc-time` with `format="day"`). Each session is a row: on the left the time range in bold ("17:30–18:30", `fc-time` with `format="range"`) with "Warsaw time" under it, and on the right the client name above the venue name, right aligned. The row has no price.
*   **Deep link.** The email link is `<trainer-web-origin>/?request=<bookingId>`. After the first successful load of the pending list, if the id is in the list the card gets the accent border, the badge "Opened from email", keyboard focus, and scrolls into view. A failed first load waits for the first success, and later polls do not highlight again. The highlight and badge end when the trainer answers that card or leaves the page. If the id is not in the list after that load, an `fc-state` notice (info) shows the text in "Page copy"; it is dismissed when the trainer answers any card or leaves the page. Opening the link never accepts anything. Nothing in the link needs a lookup endpoint.
*   **Page header.** The page title is `h1` "Trainer home", with the subtitle "Times are shown in Warsaw time." (the city comes from `trainerVenueTimeZone`, and the subtitle is hidden while it is `null`). "Sign out" is a text-style `fc-button` at the top right, because there is no navigation shell. The page does not show the trainer's name or email. This replaces the placeholder greeting, so the e2e project changes (see table O).
*   **Page layout.** One column. On a desktop window it is centered, at most 960 px wide (token `--container-column`, pending confirmation from the design owner), and on a phone it fills the width with 20 px side padding. The "Booking requests" heading carries a badge with the number of open cards (idle, submitting and failed, not resolved ones).

**Page copy** (from the mockups):

| Where | Text |
|---|---|
| Requests empty | "No requests waiting" / "New booking requests appear here as soon as a client books you." |
| Requests error | "Could not load requests" / "Requests may be waiting for you. Check your connection and try again." / "Try again" |
| Sessions empty | "No sessions today or tomorrow" / "Confirmed sessions show up here." |
| Sessions error | "Could not load sessions" / "Your schedule may not be empty. Check your connection and try again." / "Try again" |
| Deep-link notice | "That request is no longer available. It may have expired, been answered, or belong to another trainer." |
| Failed answer | "We could not reach the server. Your answer may not have been saved." / "Retry" |
| Failed refresh | "Could not refresh. Showing the update from {HH:mm}." (not in the mockups; it is the only place the stale-data state is told to the trainer) |
| Buttons | "Accept", "Decline", "Accepting", "Declining" |

**Shared UI additions** (each exported, with a spec, built with tokens only):

| Addition | Purpose |
|---|---|
| `fc-time` | Shows a UTC instant in a given IANA zone, using `Intl.DateTimeFormat` with the fixed locale `en-GB` (one language, D13) and a 24-hour clock, inside a `<time datetime>` element. The zone label is the venue's city, taken from the IANA id (`Europe/Warsaw` gives "Warsaw", `America/Argentina/Buenos_Aires` gives "Buenos Aires", `UTC` stays "UTC"). An `inline` input makes it a run of text inside a sentence (no block, no bold), as in the accepted card. Three formats through the `format` input: `datetime` (default) renders "Tue 17 Nov, 10:00 Warsaw time", or "Today, 16:00 Warsaw time" and "Tomorrow, ..." when the optional `now` input (epoch ms) is set; `day` renders "Today, Sun 15 Nov" or "Tomorrow, Mon 16 Nov" (needs `now`); `range` renders "17:30–18:30" with "Warsaw time" on a second line (needs `durationMinutes`). Angular's `DatePipe` does not accept IANA zones. |
| `fc-deadline` | "Respond by 14:30 (Warsaw)" followed by an `fc-badge` "37 min left", from an end time, a `now` value in epoch milliseconds and a zone. Minutes left round up, and under one minute shows "less than 1 min left". At or past the end the badge is not shown (the card shows its own "Expired" badge). It has no live region, so screen readers are not interrupted every second. |
| `fc-badge` | A small pill with a border for short labels: "Opened from email", "37 min left", "Accepted", "Declined", "No longer available", "Expired", and the count next to "Booking requests". It uses the `text-pill` step and the `rounded-pill` radius, and has no color variants in this feature. |
| `fc-skeleton` | Loading placeholder: grey bars inside a card-shaped box. Inputs `lines` (number of text bars, default 2) and `actions` (adds two button bars). It is `aria-hidden`, and its container sets `aria-busy`. |
| `fc-state` | A panel for empty, error and notice messages. Variants `empty`, `error` and `info`. A bold title (not for `info`), a projected body, an optional action (a text-style `fc-button`) and an icon for `error` and `info`. `error` uses `role="alert"`, the others `role="status"`. The existing `fc-alert` is not restyled, because the login pages use it. |
| `fcMoney` pipe | Formats `priceMinor` and a currency code as "120 PLN" or "120.50 PLN". |
| `fc-stack` `justify` and `align` inputs | `justify` (`start`, `end`, `between`) spreads children along the stack direction and `align` (`start`, `center`, `end`, `stretch`) places them across it. With neither set a stack keeps its layout. The page header uses `justify="between"` to put Sign out at the right, and a session row uses it with `align="end"` on the client and venue column. |
| `fc-button` `fullWidth` input | Makes the button fill its container (`w-full`), so two buttons in a horizontal stack take equal widths. The default is unchanged. |
| `fc-button` `loadingLabel` input | While `loading` is true, shows the spinner next to this label ("Accepting") instead of hiding the label. Without it the button behaves as today. |
| `fcScrollIntoView` directive | When its input becomes true, scrolls the host into view and focuses it. Feature templates cannot touch the DOM. |
| `fc-card` `highlighted` input | Accent border for the deep-linked card. |
| `fc-card` width | `fc-card` is fixed at a login-card width (`max-w-md`). Add a `size` input for a full-width variant. |
| `fc-page` `align` input | `center` (default, so the login pages are unchanged) or `top` for list pages. `top` centers one content block of at most the `--container-column` width (960 px) with 20 px side padding. The token is added to `tokens.css` and to the token table in `design-system.md`, with a test first. |

### Seed data and tests

*   The dev seed is for manual use. It adds a venue (`Europe/Warsaw`) and `approved` status for `trainer@example.com`, a second trainer with status `submitted`, and four bookings: two pending that do not overlap (one starting inside the late window), one confirmed session in progress and one tomorrow at noon. Re-running the seed deletes the seeded trainers' bookings and inserts them again. Exact values are in the Detailed Implementation Plan.
*   The e2e suite creates its own bookings in each test through a database helper, so retries and test order do not matter. Scenarios: approved trainer sees both lists, accept and decline, a lost race, the signed-out deep link, and the unapproved trainer landing on `/setup`.

### Dependencies not delivered by this feature

*   The client request flow creates the bookings, and the notifications feature sends the email with the link above. Until both exist, home runs on seeded data.
*   The admin approval screen writes `trainer_profiles.status`. Until it exists, status changes in development come from the seed or SQL.
*   Production sign-in (Cognito) must keep the deep link through the hosted login redirect.
*   Home is not released to real users before cancel and record completion exist (open question above).

### Risks

*   **Polling load.** Two small queries per open tab every 30 seconds, each scoped to one trainer. No load concern at first-release volume.
*   **A trainer misses a request while the tab is closed.** Home only helps when open. The email is the primary alert (PDR-012), and the expiry rate cannot be read against delivery because nothing is recorded (Non-Goals).
*   **A wrong "today" boundary.** The pure function owns the rule and is tested at DST changes. If a trainer later has several venues, the rule must change (open question).
*   **Seeded `expires_at` goes stale after an hour in development.** Re-run the seed.

## Alternatives Considered

Each option below was weighed in `/egm-brainstorm` or `/egm-draft`. Where the author chose another option, the reason given is the technical weakness of the rejected one, not a quote from the author.

### Where the status and checklist live

#### Alternative A: Status and checklist inside `/`

*   **Pros**: One URL and one route. No redirect between `/` and `/setup`.
*   **Cons**: Home would switch its content by status, so approved and unapproved logic share one component. Every home test needs a status. Guards cannot keep unapproved users out of approved-only routes by URL.
*   **Reason for Rejection**: Rejected by author: a separate URL makes the guard simpler, because the route decides the screen instead of a component branching on status.

### Scope of the first slice

#### Alternative B: Pending list first, then the gate, then the confirmed list

*   **Pros**: Reaches the 1-hour-deadline problem first. Slice 1 needs no status field.
*   **Cons**: Until slice 2, an unapproved trainer opens `/` and gets an error or an empty list with no explanation. There is no e2e flow for unapproved trainers.
*   **Reason for Rejection**: Rejected by author: all parts ship in one slice, so the guard is tested against real lists from the start.

#### Alternative C: Both lists first, then the gate and `/setup`

*   **Pros**: The full approved-trainer screen exists early. `/setup` gets real content once the profile screens exist.
*   **Cons**: Same unapproved-trainer gap as Alternative B. A failed fetch can look like "no requests" unless the empty state is handled carefully.
*   **Reason for Rejection**: Rejected by author, for the same reason as Alternative B.

### Where the approval status lives

#### Alternative D: A separate trainer resource (`GET /trainers/me`)

*   **Pros**: Leaves `User` unchanged. Gives the profile and venue screens a home.
*   **Cons**: One extra request after sign-in, and the guard becomes asynchronous with a loading and an unknown state. Every trainer page load depends on a second endpoint.
*   **Reason for Rejection**: Rejected by author: a field on `getMe` keeps the guard synchronous, because `AuthService` already loads the user before routing starts.

#### Alternative E: A Cognito group claim

*   **Pros**: No extra call. Fits the role model (D7).
*   **Cons**: The token changes only on refresh, so a trainer on `/setup` is not moved on after approval. The admin's reason cannot be carried in a claim, so `/setup` still needs an API call. It depends on Cognito, which is not connected yet.
*   **Reason for Rejection**: Rejected by author: the stale-token delay and the extra call for the reason remove the benefit.

### Protecting the accept button

#### Alternative F: Undo toast with a deferred commit

*   **Pros**: A mis-tap can be reversed on every card.
*   **Cons**: The accept is lost if the tab dies during the delay (needs `keepalive` on `pagehide`). The delay counts against response time. The trainer's view and the client's view disagree for those seconds.
*   **Reason for Rejection**: Rejected by author: a caption on late-window cards removes most of the risk without a commit delay.

#### Alternative G: A second "Confirm accept" tap on late-window cards

*   **Pros**: Friction only where the late-cancellation flag applies.
*   **Cons**: Two accept behaviours on one screen. If the 3-hour rule is computed wrongly (time zone, clock skew), the extra tap shows on the wrong cards or not at all. Decline stays unprotected.
*   **Reason for Rejection**: Rejected by author: one tap everywhere keeps the screen predictable.

### Where the email link goes

#### Alternative H: A link to `/` only

*   **Pros**: No query handling, highlight or dead-link cases.
*   **Cons**: With several pending requests, nothing says which one the email is about. There is no way to test "opened from the email".
*   **Reason for Rejection**: Rejected by author: a link to the specific request lands the trainer on the card that needs an answer.

#### Alternative I: A request detail route (`/requests/:id`)

*   **Pros**: One screen per request. Dead links get their own page.
*   **Cons**: Adds a route and a screen outside the first-slice scope, and a second place to accept that can drift from the one on home.
*   **Reason for Rejection**: Rejected by author: accept and decline happen in place on home, so a second surface adds scope without need.

### API shape

#### Alternative J: One home endpoint (`GET /trainers/me/home`)

*   **Pros**: One request per poll and a consistent snapshot. The server owns the day buckets.
*   **Cons**: The contract is tied to this screen. Other screens need their own endpoint. Every poll re-sends the confirmed list, which does not need the refresh.
*   **Reason for Rejection**: Rejected by author: two list endpoints let the poll fetch only the pending list, and the sessions endpoint serves later features with another `from` and `to`.

#### Alternative K: One generic bookings endpoint (`GET /bookings` with filters)

*   **Pros**: One contract path for client, trainer and admin views. The least duplication later.
*   **Cons**: Authorization differs by role and status, so one endpoint carries the most branching. Home still makes two filtered calls.
*   **Reason for Rejection**: Rejected by author: the branching and the growing filter set are not worth it for one screen.

### Who decides "today and tomorrow"

#### Alternative L: The server computes the window (`window=today-tomorrow`)

*   **Pros**: No zone math in the client. The day rule lives in one place, tested against Postgres.
*   **Cons**: Later features need other windows, which means more named windows. A venue with no stored zone has no defined bucket. The endpoint is tied to this screen.
*   **Reason for Rejection**: Rejected by author: the client computes the window with a tested pure function, which keeps the sessions endpoint generic.

#### Alternative M: A wide UTC range, with the client bucketing each session by its own zone

*   **Pros**: Handles several venues. The client needs no zone before the first call.
*   **Cons**: A DST or midnight bug in the bucketing function cannot be caught by the server. The response carries sessions that home then filters out.
*   **Reason for Rejection**: Rejected by author: computing the window up front with one venue's zone is simpler, at the cost of the single-venue assumption (see Open Questions).

### Sessions from earlier today

#### Alternative R: Show everything today, including sessions that have ended

*   **Pros**: The trainer sees the full day. The window is the simple one, from local midnight to the end of tomorrow.
*   **Cons**: Ended sessions stay on home until midnight with no action available, because record completion comes later. It contradicts the brief's rule that past sessions are not shown.
*   **Reason for Rejection**: Rejected by author: a session that has ended gives the trainer nothing to do on home.

#### Alternative S: Show only sessions that have not started (`from` = now)

*   **Pros**: Matches "past sessions are not shown" literally. Nothing is filtered in the client.
*   **Cons**: A session in progress disappears at its start time. The window changes on every refresh, so the day-window function and its tests change.
*   **Reason for Rejection**: Rejected by author: a session in progress should stay visible until it ends.

### What home records

#### Alternative N: Record `firstViewedAt` only, or alert records plus view and channel

*   **Pros**: Separates "never seen" from "seen but ignored", and with alert records, "not delivered" from "delivered but unseen". The expiry rate can then be read against delivery.
*   **Cons**: Alert sent or failed recording is "not approved" in the PRD and needs an owner decision. It ties home to the notifications module and a larger data model.
*   **Reason for Rejection**: Rejected by author: nothing is recorded beyond the PRD's status timestamps. The limit is stated in Non-Goals.

### Other options weighed

#### Alternative O: WebSockets or push for the in-app alert

*   **Pros**: A request appears at once, without waiting for the next poll.
*   **Cons**: WebSockets are only proposed (Architecture 6.3) and need Redis and a gateway that do not exist. Web push is limited on iOS (Architecture 7). Reviewers advised against it for this scope.
*   **Reason for Rejection**: Rejected by author: a 30-second poll plus a refetch on focus is enough for a 1-hour window. Real-time delivery is listed under Non-Goals and can be added later behind the same stores.

#### Alternative P: "Upcoming, soonest first" instead of "today and tomorrow"

*   **Pros**: Removes the day-boundary logic. A session two days out no longer looks lost after an accept.
*   **Cons**: The list can grow long, and the day grouping the trainer asked for is gone.
*   **Reason for Rejection**: Rejected by author: today and tomorrow is the window the trainer needs. The accept confirmation on the card covers the "looks lost" case.

#### Alternative Q: Change `SignedInHome` in place

*   **Pros**: No new libraries.
*   **Cons**: `SignedInHome` is shared by the client, trainer and admin apps, so a trainer-only home would force role branches into shared code.
*   **Reason for Rejection**: Rejected by author: trainer behaviour lives in trainer-scoped libraries, and `SignedInHome` stays the placeholder for the other two apps.

#### Alternative T: The `booking` repository joins `users` and `venues` through the shared `database` library

*   **Pros**: One query per list, so it is simpler and faster.
*   **Cons**: It breaks the module rule in Architecture section 4 (cross-module calls go through public APIs, never through another module's tables) and couples `booking` to the `users` and `venues` schemas.
*   **Reason for Rejection**: Rejected by author in the Stage 9 review: the recorded rule stays intact. `booking` calls public lookups of `identity` and `trainers` and merges the results in memory.

#### Alternative U: A larger fixed seed for the e2e scenarios

*   **Pros**: No database helper in the e2e project.
*   **Cons**: The e2e database is never reset and runs with one worker and a retry on CI, so a retry finds the data already used. Placing "today's" session at a fixed time depends on the clock.
*   **Reason for Rejection**: Rejected by author in the Stage 9 review: each test creates its own bookings, with today's session in progress and tomorrow's at noon of the venue date.

#### Alternative V: Restyle `fc-alert` to the mockup's panel look instead of adding `fc-state`

*   **Pros**: One component for messages, with a title and an action slot.
*   **Cons**: The login pages and `SignedInHome` use `fc-alert`, so their error and info messages would change appearance, and their specs and the `role="alert"` e2e assertions would need checking.
*   **Reason for Rejection**: Rejected by author in the mockup review: the approved login pages stay untouched, so empty, error and notice panels are a new `fc-state` component.

--------------------------------------------------------------------------------

### Additional Resources

*   [First-release PRD](../prd/scheduled-in-person-sessions.md): sections 4, 6, 7, 9 and 10 define the trainer journey, the booking rules and the open questions.
*   [First-release decision log](../decisions/first-release.md): PDR-006 (1-hour window), PDR-009 (admin approval), PDR-010 and PDR-017 (cancellation flag), PDR-012 (alerts), PDR-013 (address after acceptance), PDR-018 (overlapping requests), PDR-019 (venue time zone).
*   [Architecture](../../Architecture.md): sections 5, 6.1, 6.3, 6.5 and 9.
*   [Trainer web plan](../plans/trainer-web.md): the broader roadmap. Its on-demand and dashboard parts are deferred.

### Future Improvements

*   **Cancel and record completion on home.** Both come in later features. Until they exist, home must not ship to real users.
*   **Real-time delivery.** Replace the 30-second poll with a push channel behind the same stores once WebSockets exist (Architecture 6.3).
*   **Alert delivery records.** Record alert sent or failed and `firstViewedAt` so the expiry rate can be read against delivery. Needs an owner decision to approve the PRD change.
*   **Approved but not bookable state.** Static copy for a newly approved trainer with no availability, and links to the profile and availability screens once they exist.
*   **Protecting accept.** Add an undo toast or a confirm tap if accept-then-cancel data shows mis-taps are a real problem.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Work follows `.claude/rules/workflow.md`: skeleton first, then a failing test, then the implementation, each in its own commit on the branch `feat/trainer-home` (created from `main`, never committed to `main`). Commit messages use `<type>(<scope>): <subject>`, where the scope is the name of the project the commit touches. Nothing is pushed unless asked.

### Order of work

| Step | Commit | What it contains | Why the commit is green |
|---|---|---|---|
| 1 | `feat(api): add trainer home contract and skeleton` | Contract files and the regenerated `api.d.ts`. New backend libraries `trainers` and `booking`, with stub controllers, services and guard that throw `Error('not implemented')`, and the `CodedHttpException` skeleton. `app.module.ts` wiring and the backend path aliases in `tsconfig.base.json`. | Stub routes answer 500, not 404, so the "serves every path" test in `contract.int.spec.ts` passes. Each new library sets `passWithNoTests` and ships one spec per stub asserting that it throws, so coverage stays above 80%. |
| 2 | `feat(database): add trainer, venue and booking tables` | Schema files, the migration generated with `drizzle-kit generate --name trainer_home`, and the new assertions in `migrate.spec.ts`. | The migration is generator output, and the spec passes against it. |
| 3 | `feat(repo): add trainer home frontend skeleton` | Libraries `trainer-access`, `feature-trainer-home` and `feature-trainer-setup` with stubs and `passWithNoTests`. `AuthService.refreshUser()` as an abstract method, a stub in `DevAuthService` that throws `not implemented`, a version in `UnconfiguredAuthService` that resolves with nothing, and their specs. `ApiClient` method stubs with one spec each. The frontend path aliases. The trainer-web routes are not touched. | The existing route and app specs are unchanged and stay valid. Stub specs keep coverage at 80%. |
| 4 | `test(<project>)` then `feat(<project>)`, per slice below | Red, then green. | `test` commits check lint only (`.claude/hooks/commit-guard.mjs`). `feat` commits pass tests and coverage. |
| 5 | `docs(repo): record trainer home decisions` | Architecture, plan and README edits. | Docs commit. |

Slices for step 4. Each `feat` commit leaves lint and tests green for the affected projects:

1.  `common`: coded exceptions and `code` in problem details.
2.  `database`: `seed.ts`, `seed.spec.ts`, `cli/seed.ts` and `testing.ts`.
3.  `trainers` and `identity`: the three trainer fields on `User`, the lookups, the approval guard, `me.int.spec.ts` and `dev-login.int.spec.ts`.
4.  `booking`: lists, accept and decline, `contract.int.spec.ts`, `trainer-home.int.spec.ts` and `test-app.ts`.
5.  `ui`: `fc-time` (with `zoneCity`), `fc-deadline`, `fc-badge`, `fc-skeleton`, `fc-state`, the `fcMoney` pipe, `fcScrollIntoView`, the `loadingLabel` input of `fc-button`, the `fc-card` and `fc-page` inputs, and the `--container-column` token.
6.  `data-access` and `auth`: client methods, `ApiError.code` and `refreshUser()`.
7.  `trainer-access`: the two guards and their decision table.
8.  `feature-trainer-setup`.
9.  `feature-trainer-home`: clock, day window, refresh trigger, stores and page.
10. `trainer-web`: routes and the two app specs.
11. `e2e`: the database helper and the new scenarios.

Each project keeps 80% line, function, branch and statement coverage. A red `test` commit passes the commit guard because it checks only lint for `test` commits.

### Library scaffolding

Each new library copies its configuration from a sibling. The exact generator command is taken from the generator's `--help` and the sibling's `project.json` when step 1 or 3 is built, and is recorded in that commit's message. Hand edits on top of the generator output are listed in the last column.

| Library | Directory and import path | Tags | Copy from | Hand edits |
|---|---|---|---|---|
| `trainers` | `libs/backend/trainers`, `@fitness-connect/trainers` | `scope:api`, `type:api-lib` | `libs/backend/identity` | Jest with 80% thresholds, `testTimeout: 30000`, `collectCoverageFrom` excluding specs and `index.ts`, `passWithNoTests` until slice 3. |
| `booking` | `libs/backend/booking`, `@fitness-connect/booking` | `scope:api`, `type:api-lib` | `libs/backend/identity` | The same, plus the `transformIgnorePatterns` entry for `jose` if a spec imports it. |
| `trainer-access` | `libs/frontend/trainer-access`, `@fitness-connect/trainer-access` | `scope:trainer`, `type:data-access` | `libs/frontend/auth` | Vitest with 80% thresholds in `vite.config.mts`, prefix `fc`, `passWithNoTests` until slice 7. |
| `feature-trainer-home` | `libs/frontend/feature-trainer-home`, `@fitness-connect/feature-trainer-home` | `scope:trainer`, `type:feature` | `libs/frontend/feature-home` | The same as `trainer-access`, until slice 9. |
| `venue-time` | `libs/shared/venue-time`, `@fitness-connect/venue-time` | `scope:shared`, `type:util` | `libs/shared/api-contract` | Added after the first review: the zone arithmetic that the dev seed and the e2e tests had each copied (`zoneOffsetMs`, `tomorrowNoon(zone, now)`). Generated with `@nx/js:library`, Jest with 80% thresholds, no dependencies. |
| `feature-trainer-setup` | `libs/frontend/feature-trainer-setup`, `@fitness-connect/feature-trainer-setup` | `scope:trainer`, `type:feature` | `libs/frontend/feature-home` | The same as `trainer-access`, until slice 8. |

### Public signatures

The skeleton stubs use these names and types. Tests lock them in.

```text
common
  CodedHttpException(status: number, code: string, message: string)    // body: { statusCode, message, code }
  isUuid(value: string): boolean                   // one UUID regex for every repository that answers "not found" for a bad id
  ProblemDetails.code?: string          // the filter copies a string `code` from the exception body

identity (new lookup, exported)
  UsersService.displayNames(ids: string[]): Promise<Map<string, string>>

trainers
  type TrainerUserFields = { trainerStatus: TrainerStatus | null,
                             trainerStatusNote: string | null,
                             trainerVenueTimeZone: string | null }
  TrainersService.getUserTrainerFields(user: { id: string, role: Role }): Promise<TrainerUserFields>
                                        // all null unless role is trainer
  TrainersService.isApproved(userId: string): Promise<boolean>
  TrainersService.venuesByIds(ids: string[]): Promise<Map<string, VenueSummary>>
  TrainerProfilesRepository.findProfile(userId): Promise<TrainerProfileRow | null>
  TrainerProfilesRepository.findOldestVenue(userId): Promise<VenueRow | null>
  TrainerApprovedGuard                  // reads request.user.id; throws CodedHttpException(403, 'trainer-not-approved', ...)

booking
  BookingService.listPendingRequests(trainerId): Promise<BookingRequestListDto>
  BookingService.listSessions(trainerId, from: Date, to: Date): Promise<SessionListDto>
  BookingService.accept(trainerId, bookingId): Promise<BookingDto>
  BookingService.decline(trainerId, bookingId): Promise<BookingDto>
  BookingsRepository.pendingForTrainer(trainerId): Promise<{ rows: BookingRow[], serverTime: Date }>
  BookingsRepository.sessionsForTrainer(trainerId, from, to): Promise<{ rows: BookingRow[], serverTime: Date }>
  BookingsRepository.decide(trainerId, bookingId, action: 'accept' | 'decline'): Promise<DecisionResult>
                                        // owns the transaction

frontend
  ApiClient.getBookingRequests(): Observable<BookingRequestList>
  ApiClient.getSessions(from: string, to: string): Observable<SessionList>
  ApiClient.acceptBooking(id: string): Observable<Booking>
  ApiClient.declineBooking(id: string): Observable<Booking>
  AuthService.refreshUser(): Promise<void>
  ClockService.now: Signal<number>                 // epoch ms, server-corrected, ticks every second
  ClockService.deviceNow(): number                 // device clock, to stamp the send time of a request
  ClockService.sync(serverTime: string, sentAt?: number): void
                                                   // offset = Date.parse(serverTime) - (sentAt + arrival) / 2
  REFRESH_INTERVAL_MS = 30_000
  refreshTrigger(): Observable<void>               // each store subscribes to its own
  RequestsStore  (in TrainerHome's providers)
      cards: Signal<RequestCard[]>, loadState: Signal<'loading' | 'ready' | 'error'>, acceptedCount: Signal<number>,
      lastUpdated: Signal<number | null>, accept(id), decline(id), refresh(), retry()
  SessionsStore  (in TrainerHome's providers)
      today: Signal<Session[]>, tomorrow: Signal<Session[]>, loadState: Signal<...>, refresh(), refreshAfterAccept(), retry()
  zoneCity(zone: string): string                   // "Europe/Warsaw" -> "Warsaw"
  isValidTimeZone(zone: string): boolean           // false for an id Intl does not know
  fc-time:           inputs value (ISO string), timeZone (IANA string), format ('datetime' | 'day' | 'range'),
                     now? (epoch ms), durationMinutes? (for 'range')
  fc-deadline:       inputs until (ISO string), now (epoch ms), timeZone
  fc-badge:          projects its content
  fc-skeleton:       inputs lines (number), actions (boolean)
  fc-state:          inputs variant ('empty' | 'error' | 'info'), title; projects body and an action slot
  fcMoney:           pipe (priceMinor: number, currency: string): string
  fc-button:         new optional inputs loadingLabel (string) and fullWidth (boolean)
  fc-stack:          new optional inputs justify ('start' | 'end' | 'between') and align ('start' | 'center' | 'end' | 'stretch')
  fcScrollIntoView:  selector [fcScrollIntoView], boolean input of the same name
```

### Target Files to Create/Modify

#### A. API contract (`libs/shared/api-contract`)

Use only the schema keywords that `apps/api/src/testing/json-schema.ts` supports (check its `KEYWORDS` set before writing a keyword). Extending that validator is out of scope. Nullable fields are written as `type: [string, 'null']`. Ids are `uuid`, instants are `date-time`, `priceMinor` is an integer, `currency` is an ISO 4217 string, and every field of the card schemas is in `required`. The four fields of each schema are the ones in the Technical Plan's contract block.

| File | Action | What changes and why |
|---|---|---|
| `openapi/openapi.yaml` | Modify | Add tags `trainer` and `booking`, the four paths and the new schema references. |
| `openapi/schemas/User.yaml` | Modify | Add `trainerStatus` (referencing `TrainerStatus`), `trainerStatusNote` and `trainerVenueTimeZone`, each optional and nullable. They stay out of `required`, so existing clients and test fixtures still compile. The API sets them for trainers (`trainerVenueTimeZone` is `null` until a venue exists) and `null` for clients and admins. |
| `openapi/schemas/Problem.yaml` | Modify | Add optional string `code`. The known codes are listed in its description and not as an enum. |
| `openapi/schemas/TrainerStatus.yaml` | Create | Enum `incomplete`, `submitted`, `changes_requested`, `approved`. |
| `openapi/schemas/BookingStatus.yaml` | Create | Enum of the seven PRD states. |
| `openapi/schemas/VenueSummary.yaml` | Create | `name`, `area`, `timeZone`. No address, by PDR-013. |
| `openapi/schemas/BookingRequest.yaml` | Create | The `BookingRequest` block of the Technical Plan. |
| `openapi/schemas/BookingRequestList.yaml` | Create | `serverTime` and `items`. |
| `openapi/schemas/Session.yaml` | Create | The `Session` block of the Technical Plan. |
| `openapi/schemas/SessionList.yaml` | Create | `serverTime` and `items`. |
| `openapi/schemas/Booking.yaml` | Create | `id`, `status`, `startsAt`, `decidedAt` (nullable). The accept and decline result. |
| `openapi/paths/trainer-booking-requests.yaml` | Create | `listBookingRequests`: `GET /trainers/me/booking-requests`: 200, 401, 403, 500. Tag `trainer`. |
| `openapi/paths/trainer-sessions.yaml` | Create | `listSessions`: `GET /trainers/me/sessions` with required query parameters `from` and `to` (full ISO 8601 date-times with `Z` or an offset). It returns bookings that overlap the range. Responses 200, 400, 401, 403, 500. Tag `trainer`. |
| `openapi/paths/booking-accept.yaml` | Create | `acceptBooking`: `POST /bookings/{id}/accept`, path parameter `id` as `uuid`: 200, 401, 403, 404, 409, 500. No 400, because a malformed id answers 404. Tag `booking`. |
| `openapi/paths/booking-decline.yaml` | Create | `declineBooking`: same responses. |
| `openapi/responses/Conflict.yaml` | Create | The 409 problem response. |
| `src/generated/api.d.ts` | Modify | Regenerated with `pnpm contract:types`. Never edited by hand. |

#### B. Database (`libs/backend/database`)

Enum values are literal lists in the schema files, as in `schema/users.ts`, because drizzle-kit loads them without path aliases. Column specifications are in the Technical Plan's "Data model".

| File | Action | What changes and why | Commit |
|---|---|---|---|
| `src/lib/schema/trainer-profiles.ts` | Create | `trainer_status` enum and `trainer_profiles` table. | step 2 |
| `src/lib/schema/venues.ts` | Create | `venues` table with an IANA `time_zone` and an index on `trainer_user_id`. | step 2 |
| `src/lib/schema/bookings.ts` | Create | `booking_status` enum, `bookings` table, three check constraints and three indexes. | step 2 |
| `src/lib/schema/booking-status-changes.ts` | Create | `booking_status_changes` history table with an index on `booking_id`. | step 2 |
| `src/lib/schema/index.ts` | Modify | Export the four new schema files. | step 2 |
| `migrations/0002_trainer_home.sql` | Create | Generated with `drizzle-kit generate --name trainer_home` (the flag is checked with `--help` first). It is not renamed afterwards, which would break the `_journal.json` tag. | step 2 |
| `migrations/meta/0002_snapshot.json` | Create | Generated with the migration. | step 2 |
| `migrations/meta/_journal.json` | Modify | Generated entry for the new migration. | step 2 |
| `src/lib/migrate.spec.ts` | Modify | Assert the four tables with their column names and types, the two enums' values, the three `bookings` indexes, that each of the three check constraints rejects a bad insert, and the delete cascades. | step 2 |
| `src/lib/seed.ts` | Modify | Add `pat.pending@example.com` ("Pat Pending", role trainer) to `SEED_USERS`, and `seedDevTrainerData(db, now)` with the same `NODE_ENV` guard as `seedDevUsers`. Values are under "Seed data" below. | slice 2 |
| `src/lib/seed.spec.ts` | Modify | Assertions change to 4 users and 4 credentials. New cases for the profiles, the venue, the four bookings, the guard and an idempotent re-run. | slice 2 |
| `src/cli/seed.ts` | Modify | Run `seedDevUsers`, then `(db) => seedDevTrainerData(db, new Date())`. This is what `pnpm db:seed` and the e2e global setup use. | slice 2 |
| `src/lib/testing.ts`, `src/lib/testing.spec.ts` | Modify | Test databases also get the trainer seed, so API integration tests have trainer profiles. | slice 2 |

Seed data for `seedDevTrainerData`, used for manual work (the e2e tests create their own data):

*   Profiles: `trainer@example.com` is `approved`, `pat.pending@example.com` is `submitted`.
*   Venue for Taylor: "Iron Hall Gym" (the name in the mockups), area "Powisle", address "12 Example Street", instructions "Ring the bell at the gym entrance", zone `Europe/Warsaw`.
*   Bookings for Taylor from `client@example.com`, 12000 minor units `PLN` (120 PLN, as in the mockups), 60 minutes: pending A starts at `now` plus 5 hours, requested 5 minutes ago, expires in 55 minutes. Pending B starts at `now` plus 2 hours (inside the late window), requested 10 minutes ago, expires in 50 minutes. A and B do not overlap. Confirmed C started 15 minutes ago (in progress). Confirmed D starts tomorrow at noon in the venue zone.
*   Reset: delete the seeded trainers' bookings (history rows cascade), then insert them again.

#### C. Backend common (`libs/backend/common`)

| File | Action | What changes and why |
|---|---|---|
| `src/lib/http/coded-http-exception.ts` | Create | An `HttpException` that carries a `code`, so services raise `booking-expired` and the other codes without building responses. |
| `src/lib/http/coded-http-exception.spec.ts` | Create | Status, message and code are kept. |
| `src/lib/http/problem-details.filter.ts` | Modify | Copy `code` from a coded exception into the problem body. Other exceptions are unchanged. |
| `src/lib/http/problem-details.filter.spec.ts` | Modify | Cover the `code` pass-through and its absence. |
| `src/index.ts` | Modify | Export the coded exception. |

#### D. Backend `trainers` (new library, tags `scope:api`, `type:api-lib`)

| File | Action | What changes and why |
|---|---|---|
| `src/index.ts` | Create | Public API: module, service, guard and the fields mapper. |
| `src/lib/trainers.module.ts` | Create | Provides and exports the service, repository and guard. |
| `src/lib/trainer-profiles.repository.ts`, `.spec.ts` | Create | Reads the profile and the trainer's oldest venue by `created_at`. A missing profile row reads as `incomplete`. |
| `src/lib/trainers.service.ts`, `.spec.ts` | Create | `getUserTrainerFields(user)`, `isApproved(userId)` and `venuesByIds(ids)`, with the signatures above. |
| `src/lib/trainer-user-fields.ts`, `.spec.ts` | Create | Maps the stored profile and venue to `TrainerUserFields`. |
| `src/lib/trainer-approved.guard.ts`, `.spec.ts` | Create | Throws a coded 403 `trainer-not-approved` unless the caller's status is `approved`. |

#### E. Backend `identity` (existing library)

| File | Action | What changes and why |
|---|---|---|
| `src/lib/identity.module.ts` | Modify | Import `TrainersModule`. Provide and export `UsersService`. |
| `src/lib/users.service.ts`, `.spec.ts` | Create | `displayNames(ids)`: one query on `users`, returned as a map. The public lookup that `booking` uses. |
| `src/index.ts` | Modify | Export `UsersService`. |
| `src/lib/me.controller.ts`, `.spec.ts` | Modify | Add the three trainer fields to the response (`null` for clients and admins). |
| `src/lib/user.dto.ts`, `.spec.ts` | Modify | `toUserDto(user, trainerFields)` includes `trainerStatus`, `trainerStatusNote` and `trainerVenueTimeZone`. |
| `src/lib/dev/dev-auth.service.ts`, `.spec.ts` | Modify | Inject `TrainersService` and add the three trainer fields to the returned `user`. The controller returns the service result unchanged, so it needs no edit. |
| `src/lib/dev/dev-auth.module.ts` | Modify | Import `TrainersModule`. |

#### F. Backend `booking` (new library, tags `scope:api`, `type:api-lib`)

| File | Action | What changes and why |
|---|---|---|
| `src/index.ts` | Create | Public API: the module. |
| `src/lib/booking.module.ts` | Create | Imports `TrainersModule` and `IdentityModule`. Registers both controllers. `DatabaseModule` is global and is not imported. |
| `src/lib/bookings.repository.ts`, `.spec.ts` | Create | Queries only on the `bookings` and `booking_status_changes` tables: pending list, sessions overlapping a range, and `decide`, which owns the transaction. Specs run against a real test database. |
| `src/lib/booking.service.ts`, `.spec.ts` | Create | Lists (adding client names from `UsersService` and venues from `TrainersService`), accept and decline. Logs with Nest `Logger('BookingService')` as `JSON.stringify({ event: 'booking.decided', bookingId, trainerId, action, result, secondsToDeadline, minutesToStart })`, where `result` is `ok`, `repeat` or the problem code. Rejections (403, 409) log at `log` level with the same shape. |
| `src/lib/trainer-bookings.controller.ts`, `.spec.ts` | Create | `GET /trainers/me/booking-requests` and `GET /trainers/me/sessions`. `@Roles('trainer')` plus `TrainerApprovedGuard`. |
| `src/lib/bookings.controller.ts`, `.spec.ts` | Create | `POST /bookings/:id/accept` and `/decline`, with the same guards. A malformed id answers 404, like an unknown one. |
| `src/lib/sessions-query.dto.ts`, `.spec.ts` | Create | Validates `from` and `to` as full ISO 8601 date-times with `Z` or an offset, `from` before `to`, span at most 7 days, else 400. |
| `src/lib/booking.dto.ts`, `.spec.ts` | Create | Maps rows to `BookingRequest`, `Session` and `Booking`. Leaves out the address and any internal column. |

#### G. API app (`apps/api`)

| File | Action | What changes and why |
|---|---|---|
| `src/app/app.module.ts` | Modify | Import `TrainersModule` and `BookingModule`. |
| `src/app/me.int.spec.ts` | Modify | Expect the three trainer fields for trainers (approved and submitted) and `null` for the other roles. |
| `src/app/dev-login.int.spec.ts` | Modify | Expect the three trainer fields in the login response. |
| `src/app/contract.int.spec.ts` | Modify | Validate real responses of the new operations against the contract. |
| `src/app/trainer-home.int.spec.ts` | Create | API integration cases listed under "Test cases". |
| `src/testing/test-app.ts` | Modify | Helper to seed the trainer data for a test database (calls `seedDevTrainerData`). |

#### H. Root configuration

| File | Action | What changes and why |
|---|---|---|
| `tsconfig.base.json` | Modify | Path aliases for `@fitness-connect/trainers` and `@fitness-connect/booking` (step 1), and for `@fitness-connect/trainer-access`, `@fitness-connect/feature-trainer-home` and `@fitness-connect/feature-trainer-setup` (step 3). |

The existing `scope:trainer` and `type:` constraints in `eslint.config.mjs` are expected to need no change. The skeleton's lint run verifies it.

#### I. Shared data access and auth (existing libraries)

| File | Action | What changes and why |
|---|---|---|
| `libs/frontend/data-access/src/lib/api-types.ts` | Modify | Export `TrainerStatus`, `BookingRequest`, `BookingRequestList`, `Session`, `SessionList` and `Booking` from the contract types. |
| `libs/frontend/data-access/src/lib/api-client.ts`, `.spec.ts` | Modify | Add `getBookingRequests()`, `getSessions(from, to)`, `acceptBooking(id)` and `declineBooking(id)`. Stubs in step 3. |
| `libs/frontend/data-access/src/lib/api-error.ts`, `.spec.ts` | Modify | Add a `code` getter that reads the problem's `code`. |
| `libs/frontend/data-access/README.md` | Modify | Add the four methods to its `ApiClient` table. |
| `libs/frontend/auth/src/lib/auth-service.ts` | Modify | Add abstract `refreshUser(): Promise<void>`. It reloads `GET /v1/me` into `user` and rejects on failure. Added in step 3. |
| `libs/frontend/auth/src/lib/dev-auth-service.ts`, `.spec.ts` | Modify | A stub in step 3, implemented in slice 6. A 401 is handled by the auth interceptor, so the method only rethrows. Other errors reject and keep the user. |
| `libs/frontend/auth/src/lib/unconfigured-auth-service.ts`, `.spec.ts` | Modify | Resolve with nothing, as there is no session. Added in step 3. |
| `libs/frontend/auth/README.md` | Modify | Document `refreshUser()`. |

#### J. Shared UI (`libs/frontend/ui`)

All new components are standalone, signal-based and use only tokens from `tokens.css`. Each gets a spec, and each is exported from `src/index.ts`.

| File | Action | What changes and why |
|---|---|---|
| `src/lib/time/zone-city.ts`, `.spec.ts` | Create | `zoneCity(zone)`: the last path segment of the IANA id with underscores turned into spaces (`Europe/Warsaw` gives "Warsaw", `America/Argentina/Buenos_Aires` gives "Buenos Aires", `UTC` gives "UTC"). |
| `src/lib/time/time.ts`, `.spec.ts` | Create | `fc-time`. Inputs `value` (ISO instant), `timeZone`, `format` (`datetime`, `day` or `range`), `inline` (boolean), and optional `now` (epoch ms) and `durationMinutes`. Renders with `Intl.DateTimeFormat`, locale `en-GB` (a constant `UI_LOCALE`) and a 24-hour clock, inside a `<time>` element with a `datetime` attribute. The three formats and the "Today," and "Tomorrow," forms are described in the Technical Plan. |
| `src/lib/deadline/deadline.ts`, `.spec.ts` | Create | `fc-deadline`. Inputs `until`, `now` (epoch ms) and `timeZone`. Renders "Respond by 14:30 (Warsaw)" and an `fc-badge` with the time left. Minutes round up, and under one minute shows "less than 1 min left". At or past `until` it shows no badge. No live region. |
| `src/lib/badge/badge.ts`, `.spec.ts` | Create | `fc-badge`: a bordered pill that projects its content, using the `text-pill` step and the `rounded-pill` radius. |
| `src/lib/skeleton/skeleton.ts`, `.spec.ts` | Create | `fc-skeleton` with inputs `lines` and `actions`, drawn with the `line-card` token, `aria-hidden`. |
| `src/lib/state/state.ts`, `.spec.ts` | Create | `fc-state` with variants `empty`, `error` and `info`, a `title` input, a projected body and an action slot. Icon for `error` and `info`. `role="alert"` for `error`, `role="status"` otherwise. |
| `src/lib/money/money.ts`, `.spec.ts` | Create | Pipe `fcMoney`: `priceMinor` divided by 100, no decimals when whole and two when not, then the currency code ("120 PLN", "120.50 PLN"). Assumes two decimals for every currency. |
| `src/lib/stack/stack.ts`, `.spec.ts` | Modify | New optional inputs `justify` and `align`, mapped to Tailwind classes (`justify-start`, `justify-end`, `justify-between`, `items-start`, `items-center`, `items-end`, `items-stretch`). No class is added when they are not set. |
| `src/lib/button/button.ts`, `.spec.ts` | Modify | New optional inputs `loadingLabel` and `fullWidth` (host `flex w-full` and inner button `w-full`; the default host stays `inline-flex`). `loadingLabel`: When `loading` is true and it is set, the button shows the spinner and that label, stays disabled and keeps `aria-busy`. Without it the loading look is unchanged, so the login pages are not affected. |
| `src/styles/tokens.css` | Modify | Add `--container-column: 60rem` (960 px), after the design owner confirms the width. A test of `fc-page align="top"` comes first (the "Adding or changing a token" steps in `design-system.md`). |
| `src/lib/scroll-into-view/scroll-into-view.ts`, `.spec.ts` | Create | `fcScrollIntoView` directive. When its boolean input turns true, sets `tabindex="-1"` on the host, scrolls it into view and focuses the host. |
| `src/lib/card/card.ts`, `.spec.ts` | Modify | Add `highlighted` (accent border) and `size` (`default` keeps `max-w-md`, `full` fills the width). |
| `src/lib/page/page.ts`, `.spec.ts` | Modify | Add `align` (`center` by default, `top` for list pages). `top` centers one content block of at most the `--container-column` width, with 20 px side padding. |
| `src/test-setup.ts` | Modify | jsdom has no `Element.prototype.scrollIntoView`, so add a stub for the directive spec. |
| `src/index.ts` | Modify | Export the new items: `fc-time`, `fc-deadline`, `fc-badge`, `fc-skeleton`, `fc-state`, `fcMoney` and `fcScrollIntoView`. |
| `README.md` | Modify | List the new components. |

#### K. `trainer-access` (new library, tags `scope:trainer`, `type:data-access`)

| File | Action | What changes and why |
|---|---|---|
| `src/index.ts` | Create | Public API. |
| `src/lib/trainer-status.ts`, `.spec.ts` | Create | `trainerStatusOf(user)` returns `user.trainerStatus`, or `null` for non-trainers or a missing field. |
| `src/lib/trainer-guards.ts`, `.spec.ts` | Create | `trainerApprovedGuard` and `trainerSetupGuard`. The spec is the guard decision table from the Technical Plan, including signed out, wrong role, and a trainer with a `null` status. |

#### L. `feature-trainer-setup` (new library, tags `scope:trainer`, `type:feature`)

| File | Action | What changes and why |
|---|---|---|
| `src/index.ts` | Create | Exports `TrainerSetup`. |
| `src/lib/trainer-setup.ts`, `.spec.ts` | Create | The read-only page. On entry it calls `refreshUser()`. It shows the status message from the table below, the admin's note for `changes_requested`, a "Check again" button, sign-out, and an error with a retry when the refresh fails. When a refresh returns `approved` it navigates to `/`. |

| Status | Heading text | Body text |
|---|---|---|
| `incomplete` | Your profile is not ready yet | Profile setup is not available yet. Your account is waiting for it. |
| `submitted` | Your profile is under review | An admin is reviewing your profile. Check again later. |
| `changes_requested` | Changes needed | An admin asked for changes. Reason shown from `trainerStatusNote`. |

#### M. `feature-trainer-home` (new library, tags `scope:trainer`, `type:feature`)

The page holds its markup inline, with `@for` loops over requests and sessions. Per D16 and section 7.1 of `Architecture.md`, no card component is created in the feature library. Headings: the greeting is `h1`, the two list sections are `h2`, and a client name on a card is `h3`.

| File | Action | What changes and why |
|---|---|---|
| `src/index.ts` | Create | Exports `TrainerHome`. |
| `src/lib/trainer-home.ts`, `.spec.ts` | Create | The page: `h1` "Trainer home" with the subtitle "Times are shown in {City} time.", the "Sign out" text button, the deep-link notice, the "Booking requests" section with its count badge and cards, and the "Today and tomorrow" section with day groups and session rows. Loading, empty and error states use `fc-skeleton` and `fc-state` with the copy in the Technical Plan. All markup uses `fc-*` only. It provides both stores in its `providers`. An effect calls `sessions.refreshAfterAccept()` for each increase of `requests.acceptedCount()`. The header row uses `fc-stack` `justify="between"`, the Accept and Decline buttons use `fullWidth`, and the session row puts the client and venue in a right-aligned stack. |
| `src/lib/clock.service.ts`, `.spec.ts` | Create | Server-time offset and a `now` signal ticking each second. Other code in the library takes `now` from it, and `clock-source.spec.ts` (a source scan, with `.spec.ts` of its own in the same folder) fails if any other source file reads the device clock. Specs use fake timers. |
| `src/lib/late-window.ts`, `.spec.ts` | Create | Exports `LATE_WINDOW_MS` (3 hours), with a one-line comment citing PDR-010. |
| `src/lib/day-window.ts`, `.spec.ts` | Create | Three pure functions on epoch milliseconds: `dayWindow(now, zone)` returns `{ from, to }`, `dayOf(startsAt, zone, now)` returns `'today'`, `'tomorrow'` or `null`, and `hasEnded(startsAt, durationMinutes, now)` is true when `startsAt` plus duration is at or before `now`. |
| `src/lib/refresh-trigger.ts`, `.spec.ts` | Create | Emits on start, on the tab becoming visible, and every `REFRESH_INTERVAL_MS` (30 000) while visible. |
| `src/lib/refresh-queue.ts` | Create | `RefreshQueue`: the refresh rules both stores share. Polls and manual refreshes are dropped while a request is in flight or waiting, `refreshAfterInFlight()` queues behind the request in flight, and a synchronous throw of the fetch cannot leave the busy count raised. Covered through the store specs. |
| `src/lib/requests-store.ts`, `.spec.ts` | Create | Pending list state, the map of cards, accept and decline, error mapping from `ApiError.code`, and a 403 `trainer-not-approved` handled with `refreshUser()` then navigation to `/setup`, per the state machine in the Technical Plan. Refresh uses `exhaustMap`. Exposes `acceptedCount`, which goes up by one for each accept the server confirms (not for a decline, a failure or an unavailable answer). |
| `src/lib/sessions-store.ts`, `.spec.ts` | Create | Confirmed list state for today and tomorrow, with its own loading, empty and error states. Hides sessions for which `hasEnded` is true, using `ClockService.now`. Handles a 403 like `RequestsStore`. Has `refreshAfterAccept()`, which fetches again after the request in flight (polls and manual refreshes are dropped while busy). |
| `src/lib/request-card-state.ts`, `.spec.ts` | Create | The per-card state machine (idle, submitting, accepted, declined, unavailable with a `reason` of `expired`, `withdrawn` or `answered`, expired, failed) as pure functions, following the transition table in the Technical Plan. |

The deep-link notice, the highlight and the page copy follow the Technical Plan.

#### N. Trainer app (`apps/trainer-web`)

| File | Action | What changes and why |
|---|---|---|
| `src/app/app.routes.ts` | Modify | Add `setup` with `[authGuard, roleGuard('trainer'), trainerSetupGuard]`. Change `''` to one parent with `canActivate: [authGuard, roleGuard('trainer')]`, `canActivateChild: [trainerApprovedGuard]` and one child that loads `TrainerHome`. Keep `**` redirecting to `''`. Change the login description to "Answer booking requests and see your schedule", because the old text promised earnings, which are out of scope (PDR-004). |
| `src/app/app.routes.spec.ts` | Modify | Update the description assertion to the new text, give fixtures `trainerStatus: 'approved'`, stub the `ApiClient` list methods, and add the routing table cases (signed out, wrong role, approved, unapproved, `**`, and `returnUrl` keeping `?request=<id>`). |
| `src/app/app.spec.ts` | Modify | Expect the trainer home (`h1` "Trainer home") instead of `fc-signed-in-home`, with an approved trainer fixture. |

#### O. End-to-end (`apps/e2e`)

| File | Action | What changes and why |
|---|---|---|
| `src/db.ts` | Create | Helper using `pg` and `E2E_DATABASE_URL` from `stack.ts`. `createBooking(options)` inserts a booking and returns its id. `expireBooking(id)` moves a request's deadline into the past. |
| `src/apps.ts` | Modify | Add an optional `unapprovedTrainer: { email, displayName }` to `AppUnderTest`, set for the trainer app. Set the trainer app's `homeHeading` to `Trainer home`, and add `showsEmail: boolean` (true for client and admin, false for trainer), because the new home shows neither the name nor the email. |
| `src/trainer-home.e2e.ts` | Create | Starts with `test.skip(app.name !== 'trainer-web')`, because `playwright.config.ts` runs every `*.e2e.ts` for all three apps. Each test creates its own bookings through `db.ts`. Today's session starts 5 minutes before now and lasts 60 minutes, so it is in progress whenever the test runs. Tomorrow's session starts at noon of tomorrow's venue date (found with `Intl.DateTimeFormat` parts), which avoids the DST gap. Scenarios: approved trainer sees both lists; accept; decline; a lost race (the test expires the request through the database); the signed-out deep link; an unapproved trainer lands on `/setup`. |
| `src/login.e2e.ts` | Modify | Assert that the email text is visible only when `app.showsEmail` is true. The `h1` assertions use `app.homeHeading`, so they follow the new trainer value. Home has one `h1`, so the strict-mode assertions still hold. |
| `src/landing.e2e.ts` | No change | It asserts only the landing title and the sign-in button. |

#### P. Documentation

| File | Action | What changes and why |
|---|---|---|
| `Architecture.md` | Modify | Section 2: add D22 (approval status as flat fields on `getMe`, with synchronous guards), D23 (polling is the first-release in-app alert), D24 (problem details carry an optional `code`) and D25 (cross-module reads go through public lookups). Section 5: change the `booking` lifecycle to the PRD states. Section 6.3: "Polling first; WebSockets proposed". Section 11: name the trainer home as the current step. |
| `docs/plans/trainer-web.md` | Modify | Section 6 route table: narrow the `/` row to this home (pending requests and today's and tomorrow's sessions; no stats). Add a `/setup` row (read-only verification status). Leave `/onboarding` and `/verification` as planned, because `/setup` covers only the status display until they exist. Fix the tag of `auth` in section 4 to `type:data-access`. |
| `README.md` | Modify | Mention the second seeded trainer in its list of seeded users. |
| `.claude/rules/design-system.md` | Modify | Add the `--container-column` row to the token table and mention `fc-badge`, `fc-skeleton` and `fc-state` under "Where each rule is applied". |
| `libs/backend/trainers/README.md`, `libs/backend/booking/README.md`, `libs/frontend/trainer-access/README.md`, `libs/frontend/feature-trainer-home/README.md`, `libs/frontend/feature-trainer-setup/README.md` | Create | Generated by Nx, then edited to describe each library's purpose and boundaries. |

### Pseudocode

Accept and decline, inside one transaction at the default `READ COMMITTED` isolation. The repository's `decide` method owns it:

```text
decide(trainerId, bookingId, action):
  1. target = SELECT client_user_id FROM bookings WHERE id = :id AND trainer_user_id = :trainer   // no lock
     none (also a malformed id): 404
  2. SELECT * FROM bookings
       WHERE client_user_id = target.client_user_id AND status = 'pending'
       ORDER BY id FOR UPDATE          // the same lock order for every caller, so no deadlock
     then re-read the target row with FOR UPDATE if it was not among them
  3. decide from the target's status with now = clock_timestamp() (decision table below)
  4. UPDATE the target (status, decided_at); INSERT booking_status_changes
  5. accept only: for each OTHER locked row with expires_at > now AND
       range [starts_at, starts_at + duration) overlaps the target's range (half-open):
         UPDATE status = 'withdrawn'; INSERT booking_status_changes
     rows with expires_at <= now are left as they are
  6. log one JSON line; return the updated target
```

| Current status | Accept | Decline |
|---|---|---|
| `pending`, `expires_at > now`, session not started | confirm, 200 | decline, 200 |
| `pending`, `expires_at > now`, `starts_at <= now` | 409 `booking-expired` ("The session has already started.") | decline, 200 (clears a stale request) |
| `pending`, `expires_at <= now` | 409 `booking-expired` | 409 `booking-expired` |
| `confirmed` | 200, no change | 409 `booking-not-pending` |
| `declined` | 409 `booking-not-pending` | 200, no change |
| `expired` | 409 `booking-expired` | 409 `booking-expired` |
| `withdrawn` | 409 `booking-withdrawn` | 409 `booking-withdrawn` |
| `cancelled`, `completed` | 409 `booking-not-pending` | 409 `booking-not-pending` |

Sessions query, in the repository: confirmed bookings of the trainer where `starts_at < to` and `starts_at + duration_minutes * interval '1 minute' > from`, ordered by `starts_at`.

Day window (client, pure, no date library):

```text
dayWindow(now, zone):
    D = the local date of `now` in `zone`, read with Intl.DateTimeFormat(..., { timeZone: zone }).formatToParts
    from = start(D)          // the earliest instant whose local date is D
    to   = start(D + 2 days)
    return { from, to }

start(date): search from (UTC midnight of date) - 14 h to + 14 h for the first instant whose
             local date in `zone` equals `date`. A day without a local 00:00 (a DST gap)
             therefore starts at the first instant that exists.
```

### Test cases

*   **`common`:** `CodedHttpException` keeps status, message and code. The filter copies `code` and omits it otherwise.
*   **`trainers`:** `getUserTrainerFields` for a client and an admin (all `null`), a trainer without a profile row (`incomplete`, venue time zone `null`), a trainer with each status, a note present and absent, and several venues (the oldest wins). `venuesByIds`. The guard allows only `approved` and otherwise throws 403 with the code.
*   **`booking` repository and service (real Postgres):** the pending list excludes requests past their deadline by time, other trainers and other statuses, and sorts by `expires_at`. A request with `expires_at == now` is excluded. The sessions list is overlap-based: a running session that started before `from` is returned, `to` is exclusive, and a span of exactly 7 days is accepted. Accept and decline for each row of the decision table, repeat accept and repeat decline, and accept racing expiry (the deadline passes during the lock wait). Two trainers accepting one client's overlapping requests concurrently end with exactly one confirmed and the other withdrawn, with no deadlock. Touching ranges stay pending. An overlapping request past its deadline is left alone. Every change writes a history row. The service takes client names and venues from `UsersService` and `TrainersService` only.
*   **`booking` controllers and `trainer-home.int.spec.ts`:** 401 without a token, 403 for a client and for an unapproved trainer (code `trainer-not-approved`), 404 for another trainer's booking and for a malformed id, 400 for a bad `from` or `to` (a span over 7 days, a bare date, `from` after `to`), response shapes validated against the contract, and no `address` field anywhere.
*   **`contract.int.spec.ts`:** every new path is served and conforms for its documented statuses.
*   **`ui`:** `zoneCity` for `Europe/Warsaw`, a zone with an underscore and `UTC`. `fc-time` in each format (`datetime`, `day`, `range`), the "Today," and "Tomorrow," forms, the city label, a `<time datetime>` element, and a DST date. `fc-deadline` rounds minutes up, shows "less than 1 min left", and shows no badge at the boundary. `fc-badge` projects its content. `fc-skeleton` renders the requested lines and actions and is `aria-hidden`. `fc-state` roles (`alert` for `error`, `status` otherwise), icon and action slot. `fcMoney` for whole and fractional amounts. `fc-button` with `loadingLabel` shows the spinner and the label, and without it behaves as before. `fcScrollIntoView` focuses and scrolls when its input becomes true and not before (with `scrollIntoView` stubbed in `test-setup.ts`). `fc-card` highlighted and size. `fc-page` align. `fc-stack` justify and align classes and no extra class by default; `fc-button` `fullWidth` classes on the host and the inner button.
*   **`data-access` and `auth`:** each new `ApiClient` method (URL, method, error mapping), `ApiError.code`, and `refreshUser()` success, rejection with the user kept, and no sign-out of its own.
*   **`trainer-access`:** the guard decision table, plus a trainer with `trainerStatus` `null`.
*   **`ClockService`:** `sync` sets the offset, `now` ticks each second (fake timers), and a skewed device clock does not move the result.
*   **`refreshTrigger`:** emits on start, again after `REFRESH_INTERVAL_MS` while visible, on becoming visible, and not while hidden.
*   **`RequestsStore` and `request-card-state`:** every row of the transition table. A poll never overwrites a `submitting` card. Resolved cards survive a poll that drops them. A failed refresh keeps the last list. With no data it shows the error state, not the empty state. `exhaustMap` ignores an overlapping trigger. A 403 navigates to `/setup`, or shows the error if the status is still `approved`. `acceptedCount` counts accepts only, not declines or failed or unavailable answers.
*   **`SessionsStore`:** groups by `dayOf`, hides ended sessions as the clock passes the end, shows an error when the venue time zone is `null`, and handles a 403. `refreshAfterAccept` fetches at once when idle, waits for a request in flight and then fetches again, and polls and manual refreshes are still dropped while it waits.
*   **`TrainerHome`:** skeleton, empty, error and loaded states for both lists with the copy in "Page copy", the request count badge, the late caption on a card inside 3 hours only, each card state's text (including the three unavailable reasons and the expired and failed cards), the highlight with its badge and its end, the notice for an unknown id, the subtitle (hidden when the zone is `null`), the day groups and session rows, and sign-out. the header, answer buttons and session rows use the layout inputs, the sessions load again after an accept (and not after a decline).
*   **`TrainerSetup`:** each status text, the missing-note case, "Check again" success and failure, and navigation to `/` when approved.
*   **`trainer-web`:** the route table (signed out, wrong role, approved, unapproved, `**`), and `returnUrl` keeps `?request=<id>`.
*   **e2e:** the scenarios listed in table O, each creating its own data.

### Verification Plan

*   **Compilation/Build**: `pnpm nx affected -t build --base=main`, plus `pnpm check:prod-bundles` to confirm no dev code reaches production bundles.
*   **Contract**: `pnpm contract:lint`, then `pnpm contract:types`. No uncommitted diff in `api.d.ts` afterwards.
*   **Unit tests**: `pnpm nx affected -t test --base=main`, using Jest (`jest.config.cts`) for `common`, `database`, `identity`, `trainers`, `booking` and `api`, and Vitest (`vite.config.mts`) for the frontend projects. Integration tests need local Postgres (`pnpm dev:infra`).
*   **Static analysis and linting**: `pnpm nx affected -t lint --base=main`. The raw-HTML lint rule must stay on. A feature template with a raw element fails it.
*   **Test coverage requirement**: 80% lines, functions, branches and statements per project. No threshold is lowered.
*   **E2E/Integration**: `pnpm nx e2e e2e`. All three apps' existing login scenarios and the new trainer home scenarios pass.
*   **Manual check in a browser** (UI rule): run the API and `trainer-web`, sign in as `trainer@example.com`, then check: both lists; accept and decline; the late caption; the deadline flipping to "Expired"; the deep link while signed in and signed out; the second trainer landing on `/setup`; the layout at a 375 px wide viewport; Tab order (Sign out, then requests top to bottom with Accept before Decline); the desktop column no wider than 960 px; and a failed refresh with the API stopped. Compare the page and each card state with the four mockups.

--------------------------------------------------------------------------------

*Drafted with EGM*
