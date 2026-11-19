# Goldfish Annotated Review Report

Status: resolved

Outcome: "auto accept" applied all 15 proposed fixes to `docs/designs/trainer-home.md`. The two choice findings took my proposals: a new `fc-state` component (`ui-1-5`) and a 960 px column token (`ui-1-12`), the latter still to be confirmed with the design owner.

**Target:** `docs/designs/trainer-home.md` (`full file`, mainly the Technical Plan "Frontend design" and the Detailed Implementation Plan)
**Source of findings:** the four UI mockups you supplied (`List states`, `Request card states`, `Trainer home, phone`, `Trainer home, desktop`), compared with the design by me. This is the Elephant's own comparison, not a Goldfish review, so no fresh reviewer has checked it. Reviewer persona in the findings is `ui-design`.

## Summary of my categories

| Category | Count | Findings |
|---|---|---|
| PROPOSE FIX | 15 | all |
| CONTEST | 0 | none |
| ESCALATE | 0 | none (two findings need a choice from you; see below) |
| DECLINE | 0 | none |

Two findings need a choice from you, because more than one answer is defensible:

*   `ui-1-5`: new `fc-state` component for empty, error and notice panels, or restyle the existing `fc-alert` (which the login pages also use).
*   `ui-1-12`: the width of the desktop content column, which I can only estimate from the image.

Items 19 and 20 of the earlier Stage 9 review (deep-link rules, copy table, content width) were skipped. The mockups now supply that content, so findings `ui-1-4`, `ui-1-12` and `ui-1-13` replace them.

## What already matches the mockups (no finding)

*   Two sections in the order requests first, sessions second, and requests sorted by soonest deadline (Tomasz at 14:05 before Anna at 14:30).
*   Accept as the primary button and Decline as the secondary, side by side.
*   The late-window caption on a card that starts within 3 hours.
*   The highlighted card with an accent border.
*   Sign-out as a text-style button on the home page.
*   Card states idle, submitting, accepted, declined, unavailable, expired and failed.
*   The heading levels in `Architecture.md` terms: one `h1`, `h2` for sections, `h3` for client names and day groups.

## Prioritized Findings & AI Suggestions

### [Issue 1] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-1`
*   **Affected Scope:** Lines 263, 289-290, 717-718 (`fc-time`, `fc-deadline`), and the per-card texts at 278
*   **Discrepancy Description:** The mockups label zones with the city: "Tue 17 Nov, 10:00 Warsaw time", "Respond by 14:30 (Warsaw)", "Warsaw time" under each session, and a page line "Times are shown in Warsaw time." The design dropped "Warsaw time" in the Stage 9 review (Issue 16) and uses the short zone name from `Intl`, for example "Thu 12 Nov, 10:00 CET" and "Respond by 14:30 CET".
*   **Rationale:** The mockup is the design source. A city label is also clearer for a trainer than "CET".
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** `Intl` cannot produce "Warsaw time", but the label can come from the IANA id: the last path segment with underscores turned into spaces (`Europe/Warsaw` becomes "Warsaw", `America/Argentina/Buenos_Aires` becomes "Buenos Aires"). The ids are stored (`venues.time_zone`), so no extra data is needed. `UTC` stays "UTC".
*   ***Proposed Edit:***
    *   Location: Technical Plan "Shared UI additions" table (`fc-time`, `fc-deadline`), table J rows for the same, the per-card texts in "Per-card state", and the "Page header" text from `ui-1-2`
    *   Change: `fc-time` renders "{weekday} {day} {month}, {HH:mm} {City} time" (for example "Tue 17 Nov, 10:00 Warsaw time"). `fc-deadline` renders "Respond by {HH:mm} ({City})". Add one pure helper `zoneCity(zone)` in `libs/frontend/ui` with a spec. Replace every "CET" example in the design with the city form. Drop the "short zone name" wording.

### [Issue 2] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-2`
*   **Affected Scope:** Lines 11, 283, 754, 780 (page heading, e2e "no change" row)
*   **Discrepancy Description:** The mockups show the title "Trainer home", a subtitle "Times are shown in Warsaw time." and a "Sign out" button at the top right. There is no "Welcome, {name}" and no email. The design keeps "Welcome, {name}" and "Signed in as {email}" so the existing e2e scenarios pass without change.
*   **Rationale:** `login.e2e.ts` asserts the single `h1` equals `app.homeHeading` (lines 38, 45, 50) and that the email text is visible (line 39). With the mockup both assertions fail for the trainer app.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** The mockup wins, so the e2e project changes instead. `homeHeading` is already a per-app field in `apps.ts`, so only the trainer value changes. The email check needs a flag.
*   ***Proposed Edit:***
    *   Location: "Heading" bullet (line 283), table M `trainer-home.ts` row, table O `login.e2e.ts` and `landing.e2e.ts` row, table O `apps.ts` row
    *   Change: Heading becomes `h1` "Trainer home", with the subtitle "Times are shown in {City} time." (hidden while `trainerVenueTimeZone` is `null`), and a "Sign out" text button. Remove "Signed in as {email}". In `apps.ts` set the trainer app's `homeHeading` to `Trainer home` and add `showsEmail: boolean` (true for client and admin, false for trainer). `login.e2e.ts` (Modify) asserts the email only when `showsEmail` is true. Change the e2e table row from "No change" to this edit. `landing.e2e.ts` stays unchanged. `trainer-web` `app.spec.ts` expects "Trainer home".

### [Issue 3] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-3`
*   **Affected Scope:** Lines 263, 270-276, 700-722 (shared UI tables)
*   **Discrepancy Description:** Pills appear throughout the mockups: "Opened from email", "37 min left", "Accepted", "Declined", "No longer available", "Expired", and the count "2" next to "Booking requests". The design has no badge or pill component, and `fc-deadline` renders the time left as plain text.
*   **Rationale:** Feature templates cannot use raw elements, so the pill must be a shared component.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** A single `fc-badge` covers all of them. The tokens exist: `rounded-pill`, `border`, and the `text-pill` type step (13 px, 600 weight), per `design-system.md`. Text is `ink`, so contrast is met.
*   ***Proposed Edit:***
    *   Location: table J, Technical Plan "Shared UI additions"
    *   Change: Add `src/lib/badge/badge.ts`, `.spec.ts` (Create): `fc-badge` projects its content and uses only tokens. It has no color variants in this feature. Export it. `fc-deadline` renders its time left inside an `fc-badge`.

### [Issue 4] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-4`
*   **Affected Scope:** Lines 260, 852 and the skipped copy of Stage 9 Item 20 (list states, loading)
*   **Discrepancy Description:** Loading in the mockups is a skeleton: grey placeholder cards with bars and, for requests, two button placeholders; two cards for each list. The design has no loading presentation beyond "loading state", and the Stage 9 proposal for it was an `fc-alert` with "Loading…", which was skipped.
*   **Rationale:** A skeleton avoids a flash of empty content and holds the layout.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Needs a shared component, since feature templates cannot draw boxes. The grey is the existing `line-card` token.
*   ***Proposed Edit:***
    *   Location: table J, "Home page" in the Technical Plan, `trainer-home.spec.ts` case list
    *   Change: Add `src/lib/skeleton/skeleton.ts`, `.spec.ts` (Create): `fc-skeleton` with inputs `lines` (number of text bars, default 2) and `actions` (boolean, adds two button bars), marked `aria-hidden`, inside a container that sets `aria-busy`. The requests list shows two skeleton cards with 3 lines and actions, the sessions list two with 2 lines.

### [Issue 5] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-5`
*   **Affected Scope:** Lines 260, 140, 281 (empty and error panels, notice)
*   **Discrepancy Description:** Empty and error states are panels, not alerts. Empty: a white card with a bold title and one muted line. Error: a card with a full red border, an icon, a bold title, a muted line and a text-style "Try again". The notice for a missing highlighted request is a full-width outlined box with an info icon. The existing `fc-alert` is a bar with a left border and a tinted background, has no title and no action, and renders a `role` but no icon.
*   **Rationale:** `fc-alert` is used by the login pages and `SignedInHome`, so restyling it changes them.
*   ***AI Suggestion:*** PROPOSE FIX (needs your choice)
*   ***Justification:*** Two defensible answers.
    *   **Option 1: new `fc-state` component.** Variants `empty`, `error` and `info`, with `title`, projected body, an optional action slot (`fc-button` text variant) and an icon for `error` and `info`. The login pages keep their current alert. Cost: two similar components in the library.
    *   **Option 2: restyle `fc-alert`** to the mockup look with `title` and an action slot. One component, but the login error and `SignedInHome` alerts change appearance, and their specs and the e2e assertion on `role="alert"` need a check.

    I propose option 1, because it leaves the approved login pages untouched.
*   ***Proposed Edit:***
    *   Location: table J, Technical Plan "Shared UI additions"
    *   Change (option 1): Add `src/lib/state/state.ts`, `.spec.ts` (Create). Error uses `role="alert"`, empty and info use `role="status"`. Copy for these panels is in `ui-1-14`.

### [Issue 6] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-6`
*   **Affected Scope:** Lines 270-278 (card results and unavailable states)
*   **Discrepancy Description:** Resolved cards in the mockups are compact: client name, a pill, and one sentence. Accepted: pill "Accepted" and "Accepted. Tue 17 Nov, 10:00 Warsaw time." Declined: pill "Declined" and "Declined. No reason was sent." Three unavailable variants share the pill "No longer available": "This request expired before you answered.", "The client withdrew this request." and "This request was already answered." The design has one text for all 409 and 404 cases, "This request is no longer available."
*   **Rationale:** The server already returns different codes, so the card can say which one happened.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** The mapping from the contract: `booking-expired` shows the expired text, `booking-withdrawn` the withdrawn text, and `booking-not-pending` the already-answered text. A 404 is not in the mockups. I map it to the already-answered text, because an unknown or foreign id cannot be told apart (the API hides the difference), and "already answered" is the least misleading of the three. The `unavailable` state keeps a `reason` of `expired`, `withdrawn` or `answered`.
*   ***Proposed Edit:***
    *   Location: "Per-card state" table and card texts (lines 270-278), table M `request-card-state.ts` row
    *   Change: Replace the sentence of card texts with the six texts above. The `unavailable` row becomes three rows by code, plus 404 mapped to `answered`. Add the `reason` field to the state in `request-card-state.ts`.

### [Issue 7] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-7`
*   **Affected Scope:** Lines 262, 270-276 (expired card)
*   **Discrepancy Description:** At zero the mockup keeps the card's details, replaces the "min left" pill with an "Expired" pill at the top right, shows "The 1-hour response window has ended.", and shows both buttons disabled in the outlined style. The design says only "a disabled 'Expired' card".
*   **Rationale:** The mockup also shows that a disabled primary button looks outlined, which is how the Material theme renders a disabled filled button.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** No new component. It uses `fc-badge` and `fc-text` from `ui-1-3`.
*   ***Proposed Edit:***
    *   Location: "At the deadline" bullet and the state table
    *   Change: Expired card: "Expired" `fc-badge` in the header row, the details unchanged, no time-left badge, the text "The 1-hour response window has ended.", and both buttons disabled. `fc-deadline` at or past the end shows no pill and the "Respond by" line stays.

### [Issue 8] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-8`
*   **Affected Scope:** Lines 278, 700-722 (`fc-button` loading)
*   **Discrepancy Description:** In the mockup, a submitting Accept shows a spinner next to the label "Accepting", and Decline is disabled. Current `fc-button` with `loading` hides the label (`opacity-0`) and shows only a spinner over it, so the label cannot change to "Accepting" and the button keeps its width. Decline's loading label ("Declining") is not shown but follows from the same pattern.
*   **Rationale:** `fc-button` is shared by the login pages. Changing its default loading look would affect them.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Add an optional input, so existing uses are unchanged.
*   ***Proposed Edit:***
    *   Location: table J
    *   Change: Add `src/lib/button/button.ts`, `.spec.ts` (Modify): new optional input `loadingLabel`. When `loading` is true and `loadingLabel` is set, the button shows the spinner and that label, and keeps the button disabled and `aria-busy`. Without `loadingLabel` it behaves as today. The card passes "Accepting" and "Declining".

### [Issue 9] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-9`
*   **Affected Scope:** Lines 274, 270-278 (failed state)
*   **Discrepancy Description:** The failed card keeps its details and time-left pill, shows an inline error box with "We could not reach the server. Your answer may not have been saved." and a "Retry" action, and leaves Accept and Decline enabled. The design says "Not sent. Try again" with both buttons enabled and a tap to resubmit, and has no separate Retry.
*   **Rationale:** The mockup's wording is honest about the unknown outcome, and idempotency (Technical Plan) makes a repeat safe.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Retry repeats the last attempted action. Tapping Accept or Decline instead starts a fresh action, which is also allowed. The error box is the `fc-state` error variant from `ui-1-5` (inline, compact).
*   ***Proposed Edit:***
    *   Location: state table row `failed`
    *   Change: `failed` shows the message above and a "Retry" text button that resubmits the kept action. Replace "Not sent. Try again" everywhere in the design.

### [Issue 10] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-10`
*   **Affected Scope:** Lines 15, 36, 196, 263, 187-189 (card content)
*   **Discrepancy Description:** The card shows: client name; a bold date-time line that uses "Today," for today; the muted line "120 PLN · Iron Hall Gym" (price and venue name, no area, no duration); "Respond by 14:30 (Warsaw)" with the time-left pill; and the two buttons side by side at equal width. The design says "client name, date and time with zone, duration, price, venue name and area", and has no rule for money display or for "Today".
*   **Rationale:** Duration and venue area are in the payload but not on the card. Price is stored in minor units, so a formatting rule is needed.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Four edits:
    *   The card text drops duration and area. The contract keeps both fields, because they are cheap and later screens need them.
    *   Money: `{amount} {currency}`, where `amount` is `priceMinor` divided by 100, shown without decimals when whole ("120 PLN") and with two when not ("120.50 PLN"). This uses a pipe in the shared library because pipes are allowed in feature templates.
    *   Relative day: `fc-time` takes an optional `now` (epoch ms) and renders "Today, 16:00 Warsaw time" or "Tomorrow, 10:00 Warsaw time" for those days, and the weekday form otherwise.
    *   Buttons: one row, equal width, 48 px (`h-control`).
*   ***Proposed Edit:***
    *   Location: "Request card" bullet and table J
    *   Change: Replace the card sentence per above. Add `src/lib/money/money.ts`, `.spec.ts` (Create): pipe `fcMoney` with inputs `priceMinor` and `currency`, assuming two decimals for every currency (O7 is open, and PLN is the only currency in view). Add `now` to `fc-time`.

### [Issue 11] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-11`
*   **Affected Scope:** Lines 280, 189, 717 (sessions list)
*   **Discrepancy Description:** The sessions list in the mockups has a section title "Today and tomorrow" (h2), day groups "Today, Sun 15 Nov" and "Tomorrow, Mon 16 Nov" (h3), and rows with the time range "17:30–18:30" and the label "Warsaw time" under it on the left, and the client name and venue name on the right. The design has the day groups "Today" and "Tomorrow", no section title, and no rule for the row, and `fc-time` can only render a single instant.
*   **Rationale:** A time range needs the duration, and the day heading needs the date.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** One component with a `format` input keeps the number of new components down: `fc-time` formats `datetime` (default), `day` ("Today, Sun 15 Nov", using `now`) and `range` (start and end as "17:30–18:30" with the zone label on a second line, using `durationMinutes`). The row is built in the page template from `fc-card`, `fc-stack`, `fc-text` and `fc-time`.
*   ***Proposed Edit:***
    *   Location: "Confirmed sessions" bullet, table J (`fc-time` row), table M (`trainer-home.ts` row)
    *   Change: Section title "Today and tomorrow". Group headings use `fc-time format="day"`. Row: `fc-time format="range"` on the left, client name above venue name on the right (right aligned). Add the `format`, `durationMinutes` and `now` inputs to the `fc-time` row, and test cases for each format in the "Test cases" `ui` bullet.

### [Issue 12] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-12`
*   **Affected Scope:** Lines 294, 140, 721 (page layout), and the skipped Stage 9 Item 20
*   **Discrepancy Description:** On desktop, the mockup is one centered column, narrower than the viewport, with the phone layout being the same column at full width. The design adds `fc-page align="top"` and `fc-card size="full"` and gives no width limit, so lists stretch across a desktop window. The list-states image shows two columns, but that is a specimen sheet and not the page.
*   **Rationale:** `design-system.md` forbids ad-hoc sizes. A width needs a token in `tokens.css`, with a test first.
*   ***AI Suggestion:*** PROPOSE FIX (needs your confirmation of the number)
*   ***Justification:*** I measured the desktop image: the column is about 958 px of a 1706 px frame (56%). I cannot tell the scale of the export. If the frame is 1x, the column is about 960 px (`60rem`); if 2x, it is about 480 px. I propose a `column` token set to 960 px, and I suggest checking it with the design owner. Padding at phone width is 20 px on each side, as in the phone image.
*   ***Proposed Edit:***
    *   Location: table J (`fc-page`), `tokens.css` and `.claude/rules/design-system.md`
    *   Change: Add token `--container-column: 60rem` to `libs/frontend/ui/src/styles/tokens.css`, with the matching row in the `design-system.md` token table, and a test first (per its "Adding or changing a token" steps). `fc-page align="top"` centers a content block of at most that width, with the side padding as above. Add the count: the "Booking requests" heading takes an `fc-badge` with the number of open cards (idle, submitting and failed), not resolved ones.

### [Issue 13] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-13`
*   **Affected Scope:** Lines 281, 275 (highlight, deep link)
*   **Discrepancy Description:** The highlighted card has the accent border and a pill "Opened from email" at the top right. The design has the border and focus only. The deep-link rules (when the highlight is set and cleared) were skipped in the Stage 9 review (Item 19).
*   **Rationale:** The pill carries the meaning for people who cannot see the border, and the lifetime of the highlight is now visible in the design.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** The pill is part of the highlight, so it appears and disappears with it. I propose: the highlight starts after the first successful pending-list load, if the id is in the list, and ends when the trainer answers that card or leaves the page. Polling does not set it again. The notice (`ui-1-14`) shows when the id is absent after that load.
*   ***Proposed Edit:***
    *   Location: "Deep link" bullet, table M `trainer-home.ts` row
    *   Change: Add the lifetime rule above and the `fc-badge` "Opened from email" on the highlighted card.

### [Issue 14] [`ui-design`] - Severity: Major
*   **ID:** `ui-1-14`
*   **Affected Scope:** Lines 264, 281, 260 (copy)
*   **Discrepancy Description:** The mockup copy differs from the design in three places, and fills a gap in a fourth. Notice: "That request is no longer available. It may have expired, been answered, or belong to another trainer." (the design omits "or belong to another trainer"). Late caption: "Session starts within 3 hours. Cancelling later will be flagged." (the design says "Starts within 3 hours of your reply."). The empty and error panels have copy the design does not have.
*   **Rationale:** The mockup copy is the design source. "Belong to another trainer" matches the contract's 404, which hides the difference.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** One copy table in the design replaces the scattered strings.
*   ***Proposed Edit:***
    *   Location: add a "Page copy" subsection to the Technical Plan "Frontend design", and reword lines 264 and 281
    *   Change: The table:

        | Where | Text |
        |---|---|
        | Page title, subtitle | "Trainer home"; "Times are shown in {City} time." |
        | Requests section | "Booking requests" with the open-card count |
        | Requests empty | "No requests waiting" / "New booking requests appear here as soon as a client books you." |
        | Requests error | "Could not load requests" / "Requests may be waiting for you. Check your connection and try again." / "Try again" |
        | Sessions section | "Today and tomorrow", with group headings "Today, Sun 15 Nov" and "Tomorrow, Mon 16 Nov" |
        | Sessions empty | "No sessions today or tomorrow" / "Confirmed sessions show up here." |
        | Sessions error | "Could not load sessions" / "Your schedule may not be empty. Check your connection and try again." / "Try again" |
        | Deep-link notice | "That request is no longer available. It may have expired, been answered, or belong to another trainer." |
        | Late caption | "Session starts within 3 hours. Cancelling later will be flagged." |
        | Buttons | "Accept", "Decline", "Accepting", "Declining" |
        | Card texts | the ones in `ui-1-6`, `ui-1-7` and `ui-1-9` |

        The failed-refresh line "Could not refresh. Showing the update from {HH:mm}." is not in the mockups. I keep it, as it is the only place the stale-data state is told to the trainer.

### [Issue 15] [`ui-design`] - Severity: Nit
*   **ID:** `ui-1-15`
*   **Affected Scope:** Lines 189, 585 (contract `Session`)
*   **Discrepancy Description:** The contract's `Session` carries `priceMinor` and `currency`, but the session rows show neither.
*   **Rationale:** An unused field is payload and a test case for no reason.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** A later booking-detail feature can add the fields back to a schema it owns.
*   ***Proposed Edit:***
    *   Location: Technical Plan contract block, table A (`Session.yaml` row)
    *   Change: Remove `priceMinor` and `currency` from `Session`.

## Edit summary by file

*   `docs/designs/trainer-home.md`: Technical Plan (heading bullet, request card, late caption, per-card state table, confirmed sessions, deep link, shared UI additions, new "Page copy"), contract block, table A (`Session.yaml`), table J (new `fc-badge`, `fc-skeleton`, `fc-state`, `fcMoney`, `zoneCity`, and edits to `fc-time`, `fc-deadline`, `fc-button`, `fc-page`, `fc-card`), table M (`trainer-home.ts`, `request-card-state.ts`), table O (`apps.ts`, `login.e2e.ts`), the "Test cases" `ui` and `TrainerHome` bullets.
*   New design-system token `--container-column` (in the plan only; not edited until implementation).
