# Trainer home screen

* **Author:** Stanislav Blokh
* **Date:** 2026-11-15

## Overview

The trainer home screen is the first product screen in `apps/trainer-web`. Today `/` shows a greeting and a sign-out button (`SignedInHome`, shared by all three apps).

The new home is for trainers an admin has approved (PDR-009). It has two lists:

1. **Booking requests waiting for an answer.** Each card shows the client's name, the session time, the price and the venue, plus the deadline. A request expires 1 hour after the client submits it (PDR-006). The trainer accepts or declines on the card itself, with one tap and no reason. The email alert (PDR-012) links to this list.
2. **Confirmed sessions for today and tomorrow**, in the venue's time zone (PDR-019). Both lists have empty states.

A trainer who is not approved does not see home. A separate URL, `/setup`, shows their checklist and verification status. A guard sends non-approved trainers from `/` to `/setup`, and approved trainers from `/setup` back to `/`.

Home is the starting point of the app. The PRD already measures request response time and expiry rate (section 9). Home exists to move those numbers, so it has no metric of its own.

## Analysis

Seven review lenses read the hypothesis against the PRD, the decision log, Architecture.md and the current code. All seven agree on the split: `/` for approved trainers, `/setup` for the rest, pending list first. The load is small, since it is one trainer's slots. The risk is correctness under a 1-hour clock, and it sits in edges the hypothesis left unspecified.

**What exists today (checked in code).** The API has only health, `me` and dev login. A user is `{id, email, displayName, role}`. There is no approval status, venue, time zone or bookings table. `authGuard` and `roleGuard` are synchronous and read only the role. The shared UI library has no list, badge, empty state, countdown, icon, dialog, snackbar or time-zone date component.

### 1. The in-app alert has no way to reach an open page

PDR-012 requires an in-app alert, and the pending list is the only in-app surface. As scoped, nothing refreshes it. A trainer with the tab open or in the background sees nothing while the clock runs. Six lenses recommend refetching when the tab regains focus plus a poll every 15 to 60 seconds while visible. They advise against WebSockets (only proposed in Architecture 6.3, and iOS web push is limited). The brief should say this list is the in-app alert.

Related data rules:
- Each list needs its own loading, empty and error state. A failed fetch must never look like "No requests", because that causes a silent expiry.
- The server returns an absolute `expiresAt` in UTC. The pending query filters on `expiresAt > now` on the server and does not depend on the expiry sweeper (PRD section 11 allows it to run late). The client does not compute the window from the device clock.
- Show "Respond by 14:30 (Warsaw)". At zero the card becomes a disabled "expired" card and the list refetches. Sort soonest deadline first.

### 2. Accept and decline must handle races

Accept racing with expiry, withdrawal or the client's auto-withdrawal (PDR-018) is PRD acceptance item 4. The server decides, in a transaction, and a repeated call has the same result. The contract needs distinct outcomes: success, "already expired, withdrawn or decided" (409 or 410), and "unknown" after a network error. Each card moves through idle, submitting, done or terminal. Both buttons are disabled while submitting. The response returns the updated booking so no refetch is needed.

After an answer, the card leaves the list with no trace. A session more than two days away appears in neither list, so it looks lost. Show a short confirmation ("Accepted. Thu 10:00 Warsaw time") from client state.

### 3. One-tap accept is irreversible, and the exposure is narrower than assumed

Cancel is out of scope, so accept (and decline) cannot be undone anywhere until cancel ships. The late-cancellation flag (PDR-010, PDR-017) applies under 3 hours before start, or to any cancellation of a booking accepted under 3 hours before start. A mis-tap more than 3 hours out has no penalty. The real exposure is a request submitted 3 to 4 hours before start. It can only be accepted inside the flag window, and only the client is told.

Six lenses converge: keep one tap with no dialog, add a visible caption on those cards ("Starts within 3 hours of your reply: cancelling later will be flagged"), space Accept and Decline apart, make Decline visually secondary, and keep 44 px touch targets. One lens offers an alternative, an undo toast with deferred commit. It costs more: the accept is lost if the tab dies, the client waits longer, and the delay counts against response time. Decision pending.

### 4. The approval guard is async and can loop

Current guards read the JWT role synchronously. The new guard needs a fetch and three outcomes: approved, not approved, unknown. Unknown (the fetch failed) shows an error with retry. It never redirects and never grants home. The `**` redirect to `''` plus the `/` and `/setup` bounce can loop, so add a loop breaker and write guard tests as a table (signed out, wrong role, submitted, changes requested, approved, against `/` and `/setup`).

- The API must enforce approval on its own (PRD item 11). The client guard is UX only. A 403 from the bookings endpoint should trigger a status re-check.
- Hold status in one signal store, load it at sign-in, and refetch on entering `/setup`, so a trainer approved while on `/setup` moves on. Show a skeleton to avoid a flash of home.
- The guard belongs in a trainer-scoped lib, not in `libs/frontend/auth` (shared scope). Group approved-only routes under one parent. Define an allow-list of routes reachable while unapproved.
- Existing and seeded trainers have no approval value. Choose a default or a backfill so dev login and e2e scenarios keep working.
- Reviewers disagree on where the status lives: the existing `getMe`, or a separate trainer-profile resource.

### 5. `/setup` has nothing to link to

PRD section 4 says a trainer builds a profile, adds a venue and submits for verification before approval. Those screens do not exist and are out of scope. Until they do, `/setup` is a read-only status page covering the PDR-009 states: incomplete, submitted, changes requested (with reason), approved.

Also, "approved" is not "bookable". A newly approved trainer still has to publish availability and price (PRD section 4, step 2), so they land on two empty lists. Define an "approved but not bookable yet" empty state with static copy and no links to missing screens.

One lens asks whether the first slice needs two symmetric guards at all, since unapproved trainers cannot receive requests anyway. See Key Decisions.

### 6. Email deep link

The link must survive login, the approval guard and a possible `/setup` redirect, including its query string. Check that the existing login flow keeps `returnUrl` with the query; reviewers could not agree it does. Add an e2e test: a signed-out trainer opens the link, signs in and lands on that card. The link format is a contract (PDR-012), and links in sent emails cannot be migrated, so pick a stable pattern such as `/?request=<id>`. Define dead-link outcomes (expired, already answered, not this trainer's) as an inline notice, never a blank page. A link click never accepts anything.

### 7. "Today and tomorrow" needs a rule

Open points: is "today" the venue's calendar day, does a session that ended this morning stay, does an in-progress session stay. The rule is ambiguous with more than one venue (O12 is only proposed). There is no venue or time zone field yet. Compute day buckets on the server from a stored IANA zone, or use a pure function taking `now` and a zone, tested for DST and for a 00:30 local session that falls on a different UTC date. Angular's `DatePipe` does not take IANA zones, so formatting uses `Intl.DateTimeFormat`. The trainer-web plan says "trainer's time zone", which conflicts with PDR-019. The decision log wins.

A client cancelling a confirmed session (PDR-010) silently removes a row, and the trainer could travel to a cancelled session. Show "Cancelled by client" for today and tomorrow, or define refresh and notification rules (O6).

### 8. Past sessions that were never recorded

Without a recording path, sessions stay Confirmed forever. PRD acceptance item 10 and the completion measure cannot pass, and the dispute path (PDR-011) is unreachable. O10 (earliest time to record, never-recorded case) is open. This feature does not satisfy item 10. Home should not go to real users before cancel and record-completion exist. Cheap hedges: define the window as "confirmed and not completed, from start of today"; add a `needsCompletion` filter to the contract; show a read-only "ended, awaiting completion" group.

### 9. Card contents and privacy

- Client name depends on O9 (minimum client information). Price depends on O7 (currency, venue-entry cost) and O11 (price after profile edits). "Time" should be date, time, duration and zone.
- The pending payload carries venue name and area only (PDR-013). The exact address is sent only in the confirmed payload, enforced in the contract and DTO, not hidden in the UI.
- Price uses integer minor units plus a currency code (Architecture 6.5).
- With one venue per trainer (proposed in O12), a venue on each card is redundant. Treat the field set as provisional.

### 10. Measurement and operations

The PRD records only status changes with timestamps. Alert sent or failed recording is "not approved". Without it, "alert not delivered", "delivered but unseen" and "seen but ignored" look the same, so the expiry rate cannot be read honestly. Home is the only place "seen" and "acted" can be observed. Proposed: approve alert recording, and record `firstViewedAt` (server side, when the pending list is first served) and whether the decision came by deep link or in place. At minimum, state this limit in the brief.

For triage: log each accept or decline with booking ID, trainer ID, seconds left, minutes to session start, request ID and result. Log 4xx business rejections (expired, not approved) at info level. Add a request ID to errors. Frontend error capture is absent, and a 401 on an in-place accept loses the intent silently, so keep the row visible with a clear error.

### 11. Dependencies and structure

- There is no contract, API or data for approval status, pending or confirmed bookings, or accept and decline. Order: contract, then API, data-access, guard, home. Skeleton stubs throw `not implemented`, then red tests, then green (workflow.md).
- Home cannot run end to end until the client request flow, the admin approval screen and trainer availability exist. Until then use contract-first seeded or mocked data. The email itself (`notifications` module) is a hidden dependency: home alone does not improve response time without it.
- Do not edit `SignedInHome`; it is shared by three apps. Create a trainer-scoped feature lib (for example `feature-trainer-home`, tags `scope:trainer,type:feature`). `/setup` is a separate lib. They share only a status store in data-access, because feature libs may not depend on each other. Keep sign-out reachable; the placeholder holds the only one.
- Shared UI first, each with a spec: list or row, status badge, empty state, time-with-zone display, danger button variant, skeleton. Compose request cards from `fc-card`, `fc-stack`, `fc-text` and `fc-button` rather than adding a domain "booking card" to the generic library. Put time and countdown logic in a signal-based clock service testable with fake timers. The bundle is already at 510 kB against a 500 kB budget (Architecture 12).

### 12. Terminology and stale docs

"Pending" means both a booking state and a verification state, so use "changes requested" for verification, not the plan's "rejected". Say "booking requests", because "requests" in the trainer-web plan means on-demand dispatch. The plan's `/onboarding`, `/verification`, `onboardingCompleteGuard` and stats dashboard are superseded by `/setup` and this scope, and Phase 4 certification upload is ruled out by PDR-009. Note this in the plan. The login copy in `app.routes.ts` mentions earnings, which are out of scope (PDR-004). Architecture's "requested" vocabulary should use the PRD state names.

### Contradictions and resolutions

| Contradiction | Resolution |
|---|---|
| One-tap speed vs accidental irreversible accept | Caption on late-window cards plus spacing, no undo. Alternative: undo toast with deferred commit. |
| Minimal "today and tomorrow" list vs feedback and the completion loop | Inline confirmation from client state; a status-and-time window; a `needsCompletion` filter. |
| 1-hour deadline vs a passive page | Poll plus focus refetch, tab-title count, server `expiresAt`. |
| Two opposing guards vs an unreliable status field | One status signal, three-outcome guard, fail closed, 403 backstop. |
| Home has no metric vs serving expiry and response metrics | `firstViewedAt` and alert-delivery records. |

### Ideal final result

A trainer opens the email link, sees exactly the request that needs an answer, with an honest deadline, and answers in one tap. If the screen was already open, the request shows up within a minute without reloading. Nothing is wrongly empty, wrongly accepted or wrongly hidden.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * `/` for approved trainers: pending booking requests (client name, session date and time with zone, price, venue, deadline) with in-place Accept and Decline, then confirmed sessions for today and tomorrow in the venue's time zone, with empty states.
  * A guard and a read-only `/setup` page that shows verification status.
  * A refresh mechanism so the list works as the in-app alert.
  * An email deep link that lands on the request.
  * Typed accept and decline outcomes, including races.
* **Out-of-Scope Non-Goals:**
  * Stats, earnings, reviews, calendar view, notification history, past sessions.
  * Cancel and record completion (the author said "later").
  * Profile, venue and verification-submission screens, and navigation to screens that do not exist.
  * Client chat or contact.
  * A home-specific success metric.
  * WebSockets and push.

## Alternatives Weighed

* **Status and checklist inside `/` instead of a separate URL.** Not chosen: the author preferred a separate URL because it makes the guard simpler, and reviewers agree.
* **WebSockets or push for the in-app alert.** Reviewers advise against it for this scope: WebSockets are only proposed (Architecture 6.3), and iOS web push is limited. Not yet decided by the author.
* **Undo toast with deferred commit instead of caption-only.** Open. Costs: lost accept if the tab dies, longer response time, more commit logic.
* **"Upcoming, soonest first" instead of "today and tomorrow".** Open. The author chose today and tomorrow. This option removes the day-boundary logic and the "session two days out looks lost" gap.
* **Deep link to `/` only instead of to a specific request.** Open. Removes the highlight logic, but the email would not point at the request.
* **Defer `/setup` and the gate to a second slice.** Open. One lens argues unapproved trainers cannot receive requests, so the gate only improves their screen. Order: pending list, then gate and status page, then confirmed list.
* **Edit `SignedInHome` in place.** Not viable: it is shared by client, trainer and admin.

## Key Decisions & Staging for Next Steps

Decided with the author:
- `/` is for approved trainers. `/setup` is a separate URL behind a guard.
- Pending requests come first, then sessions for today and tomorrow.
- Accept and decline happen in place, with no reason.
- Cancel and record completion come later.
- No home-specific metric.

Decided during `/egm-draft` (2026-11-15):
1. Late-window accept: one tap plus a caption on cards that start within 3 hours of the reply. No undo toast, no confirm tap.
2. Email deep link goes to a specific request on home (`/?request=<id>`), with a dead-link notice.
3. First slice: everything together (pending list, confirmed list, approval guard, read-only `/setup`).
4. Approval status is a flat field on `getMe` (`trainerStatus`). The admin's note and the venue time zone are two more flat fields (`trainerStatusNote`, `trainerVenueTimeZone`).
5. Only today and tomorrow. Sessions that have ended are not shown on home; a session in progress stays until it ends. The client hides ended sessions.
6. The approval guard is synchronous: it reads the status from the user loaded at startup, and `refreshUser()` keeps it current. This replaces the asynchronous three-outcome guard described in analysis section 4. No loop breaker is needed because the statuses are exclusive.
7. No recording beyond the PRD's status timestamps. The brief states that the expiry rate cannot be read against delivery.
8. API shape: two list endpoints (pending requests, and sessions with `from` and `to`). The client computes the day window from the venue's time zone.

Still open:
- Minimum client fields (O9), price and currency (O7), one venue per trainer (O12) as preconditions for the card.
- The "approved but not bookable" state and the allow-list of routes reachable while unapproved.
- Release gate: home does not ship to real users before cancel and record completion exist.

Staging: contract first (approval status, pending and confirmed lists, accept and decline outcomes), then API stubs, shared UI components, data-access, guard, home.
