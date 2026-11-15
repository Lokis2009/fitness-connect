in# Goldfish Annotated Review Report

Status: resolved

Outcome of the interactive breakdown: 34 findings accepted and applied to `docs/designs/trainer-home.md` (Items 1 to 18 and 21 to 36; Item 17 was first skipped, then accepted). Items 19 (deep-link file row and timing rules) and 20 (`fc-list`, page copy, content width) were skipped and stay as in the design. Choices: option (a) for e2e data (per-test database fixtures) and option 1 for `booking` (public lookups into `identity` and `trainers`). No finding was contested outright or escalated.

**Target:** `docs/designs/trainer-home.md` (`lines 455-722`, "Detailed Implementation Plan")
**Source:** `implementation_readiness_report.md` (Stage 9). That report states 37 findings; 36 are listed in it (3 Blockers, 23 Majors, 10 Nits). The ids below match it.

## Summary of my categories

| Category | Count | Findings |
|---|---|---|
| PROPOSE FIX | 36 | all |
| CONTEST | 0 | none whole. Two findings are partly contested with evidence (`implementation-readiness-1-19`, `style-1-3`). |
| ESCALATE | 0 | none |
| DECLINE | 0 | none |

Two findings need a choice from you, not only approval. Their fixes change the design, and more than one answer is defensible:

*   `codebase-details-1-1` (seed and e2e data): per-test database fixtures, or more seed rows.
*   `codebase-details-1-3` (`booking` reading `users` and `venues`): a documented exception to the module rule, or public calls into `identity` and `trainers`.

Large edits are written once as **Edit blocks** at the end and referenced from the findings (for example "Block A").

## Prioritized Findings & AI Suggestions

### [Issue 1] [`implementation-readiness`] - Severity: Blocker
*   **ID:** `implementation-readiness-1-1`
*   **Affected Scope:** Lines 461-463, 469-480, 581 (Order of work, step 1)
*   **Discrepancy Description:** Step 1 adds four contract paths but the controllers arrive later. `apps/api/src/app/contract.int.spec.ts` loops over every contract path and fails on a 404, so `api` goes red after step 1.
*   **Rationale:** The commit guard blocks any non-`test`, `docs` or `ci` commit that leaves affected projects red.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read `contract.int.spec.ts`: the test "serves every path the contract defines" fails when a response is 404. A stub controller that throws `Error('not implemented')` answers 500, not 404, so the spec passes. Putting the backend skeleton in the same commit as the contract fixes it.
*   ***Proposed Edit:***
    *   Location: "Order of work" table
    *   Change: Replace the table and slice list with Block A. Step 1 becomes "contract plus API skeleton", including the stub controllers.

### [Issue 2] [`implementation-readiness`] - Severity: Blocker
*   **ID:** `implementation-readiness-1-2`
*   **Affected Scope:** Lines 465, 479, 482 (step 3 skeleton)
*   **Discrepancy Description:** The step 3 skeleton adds libraries of stubs that throw. A `feat` commit must pass tests and the 80% coverage gate, and changing the trainer-web routes breaks `app.routes.spec.ts` and `app.spec.ts` (old home, old description, fixtures without `trainerStatus`).
*   **Rationale:** `commit-guard.mjs` runs `nx affected -t test --coverage` for every type except `test`, `docs` and `ci` (lines 6 and 216).
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Fix: the skeleton does not touch `apps/trainer-web` routes (wired in slice 10), new stub-only libraries set `passWithNoTests` as `identity` already does, and every stub that exists in the skeleton ships with one spec asserting it throws `not implemented`. That keeps coverage above 80%, and the red-to-green slice replaces that spec.
*   ***Proposed Edit:***
    *   Location: "Order of work"
    *   Change: Block A, step 3, with a file-to-commit map.

### [Issue 3] [`codebase-details`] - Severity: Blocker
*   **ID:** `codebase-details-1-1`
*   **Affected Scope:** Lines 521-523, 582, 670, 718 (seed and e2e data)
*   **Discrepancy Description:** The seed has two pending requests, but the e2e scenarios (accept, decline, lost race, deep link, sees both lists) need at least four, and they mutate a shared database that is never reset. Overlaps, the late-window start, and where "today's" session sits are not defined.
*   **Rationale:** `playwright.config.ts` uses one worker and `retries: 1` on CI, so a retry finds the data consumed. Two overlapping requests from one client make accept withdraw the other (PDR-018).
*   ***AI Suggestion:*** PROPOSE FIX (needs your choice)
*   ***Justification:*** Valid. Two defensible answers: (a) each e2e test creates its own bookings through the database with a `pg` helper, so retries and order do not matter and the dev seed stays small, or (b) a larger fixed seed with fixed ids, which retries consume. I propose (a). It also lets the lost-race test create an already-near-expiry request.
*   ***Proposed Edit:***
    *   Location: Table B (`seed.ts`), table O, Verification Plan
    *   Change: Block G. The dev seed gets explicit values. The e2e suite uses a database helper with per-test bookings. Today's session is placed so it is in progress when the test runs.

### [Issue 4] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-3`
*   **Affected Scope:** Lines 463, 469-480, 508-523, 574-583, 714 (slices, `testing.ts`, seed split)
*   **Discrepancy Description:** The `database` and `api` work has no red/green slice. `testing.ts` is missing from the plan. The `tsconfig.base.json` aliases have no step, and the split of the seed between step 2 and step 4 is unclear.
*   **Rationale:** `prepareTestDatabase` in `testing.ts` seeds only users, so API int specs would run without trainer profiles.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The slice list stops at the `common` slice for backend work.
*   ***Proposed Edit:***
    *   Location: "Order of work", table B, table H
    *   Change: Block A adds database and API slices. Add `libs/backend/database/src/lib/testing.ts` and `testing.spec.ts` (Modify) to table B: test databases also get the trainer seed. Path aliases move to the skeleton steps.

### [Issue 5] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-4`
*   **Affected Scope:** Lines 537, 561, 621, 629, 642, 716 (library scaffolding)
*   **Discrepancy Description:** "Using the options of `libs/backend/identity`" leaves generator, flags, directory, import path, tags, prefix, runner and hand edits to the implementer. The two feature libs have no scaffolding description.
*   **Rationale:** The workflow's skeleton step must be reproducible. A generator gives new libs no coverage thresholds.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read `libs/backend/identity/jest.config.cts` and `project.json`: the thresholds, `testTimeout`, the `jose` `transformIgnorePatterns` and `passWithNoTests` are hand edits.
*   ***Proposed Edit:***
    *   Location: new subsection "Library scaffolding" before table D
    *   Change: A table of the five libraries (project name, directory, import path, tags, prefix, test runner, hand edits). Each library copies its config from a named sibling: `trainers` and `booking` from `identity`, `trainer-access` from `auth`, the two feature libs from `feature-home`. Generator flags are taken from `--help` and the sibling's `project.json` when the skeleton is built, and the exact command is recorded in the skeleton commit message.

### [Issue 6] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-5`
*   **Affected Scope:** Lines 529-533, 541-546, 565-572, 611-612, 641-655 (public signatures)
*   **Discrepancy Description:** Stubs must compile, but the exception constructor, the filter's use of `code`, repository and service signatures, `ClockService` API, store APIs and UI inputs are not fixed.
*   **Rationale:** Without them the implementer makes API decisions that tests then lock in.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: new subsection "Public signatures" before "Pseudocode"
    *   Change: Block B.

### [Issue 7] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-6`
*   **Affected Scope:** Lines 543-544, 553-554, 626 (`getUserTrainerFields`)
*   **Discrepancy Description:** The method takes only `userId`, so it cannot return `null` fields for non-trainers without reading `users`. The DTO type is unnamed, venue selection with several or no venue is open, and the guard table has no row for a trainer whose status is `null`.
*   **Rationale:** A missing profile row reads as `incomplete`, which would wrongly apply to clients.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table D (`trainers.service.ts`), table K, guard table in the Technical Plan
    *   Change: Signature in Block B (`getUserTrainerFields(user: { id; role })`, caller passes the role, all `null` unless `role = 'trainer'`). The venue is the trainer's oldest venue by `created_at`. Add a guard row: trainer with `trainerStatus` `null` or missing is treated as not approved and goes to `/setup`.

### [Issue 8] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-7`
*   **Affected Scope:** Lines 683-699 (accept transaction)
*   **Discrepancy Description:** Only the target row is locked, then the same client's other overlapping rows are updated. Two trainers accepting one client's overlapping requests can deadlock or both confirm. No lock order, isolation level, overlap predicate, expired-row handling or transaction owner is given. `now()` is the transaction start time.
*   **Rationale:** PRD acceptance item 5 and PDR-018 forbid overlapping confirmed sessions for a client.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The two-trainer case locks one row each and then updates the other's row.
*   ***Proposed Edit:***
    *   Location: "Pseudocode" accept block
    *   Change: Block D replaces the accept block and adds a decline block.

### [Issue 9] [`style`] - Severity: Major
*   **ID:** `style-1-1`
*   **Affected Scope:** Lines 683-684, 688, 695-698 (decline pseudocode)
*   **Discrepancy Description:** "Decline is the same" is wrong. The repeat branch must test `declined`, a decline of a `confirmed` booking is a 409 `booking-not-pending`, overlap withdrawal is accept-only, and only the success path logs.
*   **Rationale:** PDR-018 applies to accept. The Technical Plan requires info logs for 403 and 409.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: "Pseudocode"
    *   Change: Block D: a separate decline block and a decision table covering both actions.

### [Issue 10] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-8`
*   **Affected Scope:** Lines 508-523, 517-520 (columns, constraints, migration naming)
*   **Discrepancy Description:** Tables list names only. Types, nullability, defaults, `ON DELETE`, enum names, constraints and indexes are missing. Enum values must be literal lists because drizzle-kit loads schema files without path aliases (`users.ts` already does this). Renaming a generated migration breaks `_journal.json`.
*   **Rationale:** `migrate.spec.ts` cannot assert tables and indexes it cannot name.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read `schema/users.ts` and `_journal.json`.
*   ***Proposed Edit:***
    *   Location: "Data model" in the Technical Plan and table B
    *   Change: Block C. Use `drizzle-kit generate --name trainer_home` (flag confirmed with `--help` before use) instead of generating and renaming.

### [Issue 11] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-9`
*   **Affected Scope:** Lines 521-523, 670, 718 (seed details)
*   **Discrepancy Description:** Missing: second trainer's identity, client, venue, prices, durations, times, reset mechanism, the `NODE_ENV` guard, the CLI wrapper that supplies `now`, and the `seed.spec.ts` changes (it asserts exactly 3 users).
*   **Rationale:** I read `seed.spec.ts`: it asserts three users and three credentials, so a fourth seeded user breaks it.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table B (`seed.ts`, `seed.spec.ts`, `cli/seed.ts`)
    *   Change: Block G (dev seed values, reset by deleting the seeded trainer's bookings, same `NODE_ENV` guard, CLI wrapper `(db) => seedDevTrainerData(db, new Date())`, and the updated `seed.spec.ts` assertions).

### [Issue 12] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-10`
*   **Affected Scope:** Lines 665-671 (e2e mechanics)
*   **Discrepancy Description:** The e2e suite cannot learn booking ids, has no database helper, does not reset between scenarios, and `trainer-home.e2e.ts` would run for all three apps. `AppUnderTest` has no field for the second trainer. `login.e2e.ts` expects a single `h1`.
*   **Rationale:** `playwright.config.ts` runs every `*.e2e.ts` for every app project.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read `playwright.config.ts`, `apps.ts` and `login.e2e.ts`.
*   ***Proposed Edit:***
    *   Location: table O
    *   Change: Block G, e2e part: `src/db.ts` (Create), `src/stack.ts` (no change, imported), `src/apps.ts` (add optional `unapprovedTrainer`), `trainer-home.e2e.ts` starts with `test.skip(app.name !== 'trainer-web')`, and home headings use `h1` for the greeting and `h2` for sections.

### [Issue 13] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-11`
*   **Affected Scope:** Lines 490-505 (contract schemas)
*   **Discrepancy Description:** No field types, formats, `required` lists or nullability for the new schemas. `operationId`s, parameters and path tags are only in the Technical Plan.
*   **Rationale:** The contract is the source of truth (D17).
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Constraint from `codebase-details-1-7`: the repo's validator (`apps/api/src/testing/json-schema.ts`) rejects keywords it does not know, so only supported keywords are used.
*   ***Proposed Edit:***
    *   Location: table A
    *   Change: Replace "card fields" rows with a pointer to the Technical Plan's `BookingRequest`, `Session` and `Booking` blocks, plus per-field types: ids `uuid`, instants `date-time`, `priceMinor` integer, `currency` string (ISO 4217), all listed in `required`. Add `operationId`s, the `from`, `to` and `id` parameters, and nullability as `type: [string, 'null']`. Before writing any keyword, read the validator's `KEYWORDS` set.

### [Issue 14] [`codebase-details`] - Severity: Major
*   **ID:** `codebase-details-1-2`
*   **Affected Scope:** Lines 503-504, 570-571 (400 versus 404, timestamp rules)
*   **Discrepancy Description:** The controller does a UUID check that returns 400, but the accept and decline contract lists no 400, so `contract.int.spec` conformance fails. `users.repository.ts` treats a malformed id as not found. Timestamp format and the source of `serverTime` are unspecified.
*   **Rationale:** The repo convention is "malformed id is not found".
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I propose 404 for a malformed booking id, matching the repo.
*   ***Proposed Edit:***
    *   Location: table F (`bookings.controller.ts`, `sessions-query.dto.ts`), table A
    *   Change: Malformed id returns 404 (no 400 in the action contracts). The sessions query documents 400. `from` and `to` must be full ISO 8601 date-times with `Z` or an offset. `serverTime` is the database `clock_timestamp()` read by the first query of the request.

### [Issue 15] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-12`
*   **Affected Scope:** Lines 651, 701-708 (day window)
*   **Discrepancy Description:** No algorithm or library for "local midnight as a UTC instant", the DST gap is unaddressed, a session that started before `from` and is still running falls outside `startsAt >= from`, and test expectations, types and `dayOf`'s result outside the window are missing.
*   **Rationale:** The in-progress case contradicts the Goal and Decision 9.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid, and the look-back case is a real defect in the contract. `package.json` has no date library and `lib` is `es2022`, so the algorithm uses `Intl.DateTimeFormat` only.
*   ***Proposed Edit:***
    *   Location: table A (`trainer-sessions.yaml`), table M (`day-window.ts`), "Pseudocode"
    *   Change: Block E.

### [Issue 16] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-13`
*   **Affected Scope:** Lines 611-612 (time display)
*   **Discrepancy Description:** "14:30 CET" and "Thu 10:00 Warsaw time" mix label styles, and locale, hour cycle, date style and rounding of "N min left" are open.
*   **Rationale:** Specs cannot assert exact strings.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. `Intl` cannot produce "Warsaw time". I propose one style.
*   ***Proposed Edit:***
    *   Location: table J (`fc-time`, `fc-deadline`), Technical Plan copy
    *   Change: Block E (display part).

### [Issue 17] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-14`
*   **Affected Scope:** Lines 644-655 (card state machine)
*   **Discrepancy Description:** No events or transitions, the "Expired" card is a seventh state, resolved cards are "kept until the page is left" but the poll removes them, in-flight cards need protection from poll overwrites, and store scope, refetch triggers and 404 handling are open.
*   **Rationale:** Without a model, tests lock in accidental behaviour.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table M (`request-card-state.ts`, `requests-store.ts`, `sessions-store.ts`)
    *   Change: Block F.

### [Issue 18] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-15`
*   **Affected Scope:** Lines 600, 653-655, 661 (navigation after a 403)
*   **Discrepancy Description:** After a 403 `trainer-not-approved` nothing navigates, and the router ignores a navigation to the current URL. The route structure in table N does not match the Technical Plan's "one parent route".
*   **Rationale:** The URL is already `/`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Simplest fix needs no router settings: after `refreshUser()`, if `trainerStatus` is not `approved`, navigate to `/setup`. If it is still `approved`, show the error on the card.
*   ***Proposed Edit:***
    *   Location: tables I, K, M, N
    *   Change: In `requests-store.ts` and `sessions-store.ts`, on 403 `trainer-not-approved`: call `refreshUser()`, then `router.navigateByUrl('/setup')` when status is not `approved`. Routes: `''` with `canActivate: [authGuard, roleGuard('trainer')]` and `canActivateChild: [trainerApprovedGuard]` and one child loading `TrainerHome`; `setup` with its own guard list. Align wording: the setup page navigates to `/` when a refresh returns `approved`.

### [Issue 19] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-16`
*   **Affected Scope:** Lines 613, 649 (deep link)
*   **Discrepancy Description:** The deep-link logic has no file row. How `?request=` is read, "after the first load", highlight repetition and notice dismissal are open.
*   **Rationale:** A first load that fails would leave the link unhandled.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table M (`trainer-home.ts`)
    *   Change: Add to its row: the page reads `request` from `ActivatedRoute.queryParamMap` (no `app.config.ts` change). It highlights once, after the first successful pending-list load. Later polls do not re-highlight. If the id is absent after that load, the notice shows. The notice is dismissed when the trainer answers any card or leaves the page.

### [Issue 20] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-17`
*   **Affected Scope:** Lines 605-617, 626, 634, 636-641 (UI components and copy)
*   **Discrepancy Description:** No list component (a raw `ul` is not allowed), no max width for `align="top"` and `size="full"`, no loading indicator, and missing copy: headings, empty, loading, error, retry and button labels. The setup copy table has a spec note in place of text, an unclear `incomplete` body, no `approved` row and no fallback for `null`. `fcScrollIntoView` focus target is unspecified.
*   **Rationale:** `fc-heading` defaults to level 1, and `login.e2e.ts` expects one `h1`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid and needed by a human implementer, not only a reviewer. It adds two shared components (`fc-list`, `fc-list-item`) for list semantics. Loading reuses `fc-alert` as `SignedInHome` does.
*   ***Proposed Edit:***
    *   Location: table J, table L, new "Page copy" subsection
    *   Change: Block H.

### [Issue 21] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-18`
*   **Affected Scope:** Lines 482, 543-546, 567-572, 611-617, 626-627, 634, 649-655, 662-663 (test cases)
*   **Discrepancy Description:** Most spec rows say only "Create" or "Cover" with no cases. jsdom lacks `scrollIntoView`, so the directive spec needs a stub in the `ui` `test-setup.ts`.
*   **Rationale:** The standard requires concrete cases.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: new subsection "Test cases" before the Verification Plan; table J
    *   Change: Block I. Add `libs/frontend/ui/src/test-setup.ts` (Modify) for the `scrollIntoView` stub.

### [Issue 22] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-19`
*   **Affected Scope:** Lines 661-663, 671 (specs affected by the login description)
*   **Discrepancy Description:** `app.routes.spec.ts` asserts the old description and needs `trainerStatus: 'approved'` fixtures and more `ApiClient` stubs. The claim that the e2e specs need no change is unverified.
*   **Rationale:** The plan says only "cover the routing table".
*   ***AI Suggestion:*** PROPOSE FIX (the e2e claim is contested with evidence)
*   ***Justification:*** The spec changes are valid. On the e2e claim: I searched `apps/e2e/src/*.ts` for "description" and "Manage your": no match. `login.e2e.ts` and `landing.e2e.ts` check only the landing title, the sign-in button, the home heading and the email.
*   ***Proposed Edit:***
    *   Location: table N, row for `app.routes.spec.ts`
    *   Change: "Update the description assertion to the new text, give fixtures `trainerStatus: 'approved'`, stub the `ApiClient` list methods, and add the routing table cases from Block I." Add one sentence under table O: "`login.e2e.ts` and `landing.e2e.ts` assert only the landing title, the button, the home heading and the email."

### [Issue 23] [`implementation-readiness`] - Severity: Major
*   **ID:** `implementation-readiness-1-20`
*   **Affected Scope:** Lines 600-602 (`refreshUser()` timing and 401)
*   **Discrepancy Description:** An abstract method breaks every implementer until all are updated, but slice 5 adds it after the skeleton. The 401 rule inside `refreshUser()` overlaps with the interceptor.
*   **Rationale:** The interceptor already signs out on a 401 while authenticated (`auth-interceptor.ts`).
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read the interceptor. `refreshUser()` runs while signed in, so the interceptor handles the 401 and the method should not repeat it.
*   ***Proposed Edit:***
    *   Location: table I (`dev-auth-service.ts` row)
    *   Change: "Implement `refreshUser()`. A 401 is handled by the auth interceptor, so the method only rethrows. Other errors reject and keep the user." Move the abstract method and both implementations to the skeleton (Block A, step 3).

### [Issue 24] [`codebase-details`] - Severity: Major
*   **ID:** `codebase-details-1-3`
*   **Affected Scope:** Lines 566-568, 543-544 (`booking` reads other modules' tables)
*   **Discrepancy Description:** The lists need the client's name (`users`, owned by `identity`) and venue fields (`venues`, owned by `trainers`). The plan does not say whether `bookings.repository` may join them.
*   **Rationale:** `Architecture.md` section 4: "Cross-module backend calls go through each module's public API ... never through another module's internals or tables."
*   ***AI Suggestion:*** PROPOSE FIX (needs your choice)
*   ***Justification:*** Valid, and it conflicts with a recorded architecture rule, so it is your decision. Option 1: `BookingService` calls public methods (`IdentityModule` exports a `displayNames(ids)` lookup; `TrainersService` exports venue lookup by id), then merges in memory (two extra queries per list, no schema coupling). Option 2: the repository joins `users` and `venues` through the shared `database` lib, with an exception written into `Architecture.md` (one query, tighter coupling). I propose option 1.
*   ***Proposed Edit:***
    *   Location: tables D, E, F; `Architecture.md` row in table P
    *   Change: Option 1: add `IdentityModule` export `UsersService.displayNames(ids: string[]): Promise<Map<string, string>>` and `TrainersService.venuesByIds(ids: string[])`; `booking` imports both modules. Option 2: add an "Exceptions" sentence to the Architecture module rule.

### [Issue 25] [`codebase-details`] - Severity: Major
*   **ID:** `codebase-details-1-4`
*   **Affected Scope:** Lines 710-718 (verification list)
*   **Discrepancy Description:** The `-p` list omits dependents of the changed shared code (`feature-login`, `feature-home`, `client-web`, `admin-web`). It does not name which project uses which coverage config, and repeats the 80% rule.
*   **Rationale:** `fc-card`, `fc-page` and `AuthService` are shared.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Verification Plan, bullets Build, Unit tests, Lint, Coverage
    *   Change: Use `pnpm nx affected -t lint test build --base=main`. Name the configs: Jest (`jest.config.cts`) for `common`, `database`, `identity`, `trainers`, `booking`, `api`; Vitest (`vite.config.mts`) for all frontend projects. Remove the duplicate coverage sentence.

### [Issue 26] [`style`] - Severity: Major
*   **ID:** `style-1-2`
*   **Affected Scope:** Line 678 (trainer-web plan row)
*   **Discrepancy Description:** The row says `/setup` and home "supersede" `/onboarding` and `/verification`, but `/setup` is read-only and profile screens are a Non-Goal.
*   **Rationale:** The claim overstates what changes.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table P, row `docs/plans/trainer-web.md`
    *   Change: "Section 6 route table: narrow the `/` row to this home (pending requests and today's and tomorrow's sessions; no stats). Add a `/setup` row (read-only verification status). Leave `/onboarding` and `/verification` as planned; `/setup` covers only the status display until they exist. Fix the tag of `auth` in section 4 to `type:data-access`."

### [Issue 27] [`implementation-readiness`] - Severity: Nit
*   **ID:** `implementation-readiness-1-21`
*   **Affected Scope:** Line 556 (`dev-auth.controller.ts`)
*   **Discrepancy Description:** The controller returns the service result unchanged, so "pass the trainer fields through" changes nothing there.
*   **Rationale:** The fields are added in `dev-auth.service.ts`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read the controller: `return this.auth.login(body)`.
*   ***Proposed Edit:***
    *   Location: table E
    *   Change: Delete the `dev-auth.controller.ts` row and spec. In the `dev-auth.service.ts` row add: "Inject `TrainersService` and add the three fields to the returned `user`."

### [Issue 28] [`implementation-readiness`] - Severity: Nit
*   **ID:** `implementation-readiness-1-22`
*   **Affected Scope:** Lines 467, 677-679, 603 (documentation rows)
*   **Discrepancy Description:** "Record the new decisions" and "section 11" are vague. The data-access README and the root README are not listed.
*   **Rationale:** The rows should name edits.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table P
    *   Change: `Architecture.md`: add D22 (approval status as flat fields on `getMe`, synchronous guards), D23 (polling is the first-release in-app alert), D24 (problem details carry an optional `code`); change section 5's `booking` lifecycle to the PRD states; section 6.3: "Polling first; WebSockets proposed"; section 11: add the trainer home as the current step. Add rows: `libs/frontend/data-access/README.md` (Modify: the new `ApiClient` methods) and `README.md` (Modify: the second seeded trainer).

### [Issue 29] [`implementation-readiness`] - Severity: Nit
*   **ID:** `implementation-readiness-1-23`
*   **Affected Scope:** Lines 568, 697, 650 (logging, `LATE_WINDOW_MS`)
*   **Discrepancy Description:** "One structured line" has no format, rejection logging has no row, and the single definition of `LATE_WINDOW_MS` is not placed.
*   **Rationale:** The Technical Plan requires info logs for 403 and 409.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table F (`booking.service.ts`), table M
    *   Change: `booking.service.ts`: log with Nest `Logger('BookingService')` as `JSON.stringify({ event: 'booking.decided', bookingId, trainerId, action, result, secondsToDeadline, minutesToStart })`, where `result` is `ok`, `repeat`, or the problem `code`. Rejections (403 from the guard, 409 from the service) log at `log` level with the same event shape. Add row `src/lib/late-window.ts`, `.spec.ts` (Create): exports `LATE_WINDOW_MS` (3 hours) with a one-line comment citing PDR-010. Remove the constant from the `clock.service.ts` row.

### [Issue 30] [`implementation-readiness`] - Severity: Nit
*   **ID:** `implementation-readiness-1-24`
*   **Affected Scope:** Lines 491, 503 (nullability wording)
*   **Discrepancy Description:** "Trainers always get them" conflicts with optional and nullable fields.
*   **Rationale:** `trainerVenueTimeZone` is `null` until a venue exists.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table A, `User.yaml` row
    *   Change: Replace the last sentence with "The API sets them for trainers (`trainerVenueTimeZone` is `null` until a venue exists) and `null` for clients and admins."

### [Issue 31] [`codebase-details`] - Severity: Nit
*   **ID:** `codebase-details-1-5`
*   **Affected Scope:** Line 583 (`tokenFor`)
*   **Discrepancy Description:** `tokenFor(url, email)` already works for any seeded email.
*   **Rationale:** No helper change is needed for a second trainer.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table G, `test-app.ts` row
    *   Change: "Helper to seed the trainer data for a test database (calls `seedDevTrainerData`)."

### [Issue 32] [`codebase-details`] - Severity: Nit
*   **ID:** `codebase-details-1-6`
*   **Affected Scope:** Line 566 (`BookingModule` imports)
*   **Discrepancy Description:** `DatabaseModule` is global, so importing it is unnecessary.
*   **Rationale:** `identity` does not import it.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I read `database.module.ts`: it is decorated `@Global()`.
*   ***Proposed Edit:***
    *   Location: table F, `booking.module.ts` row
    *   Change: "Imports `TrainersModule` (and `IdentityModule` if Issue 24 option 1)."

### [Issue 33] [`codebase-details`] - Severity: Nit
*   **ID:** `codebase-details-1-7`
*   **Affected Scope:** Lines 611-617, 490-505 (validator keyword subset)
*   **Discrepancy Description:** `json-schema.ts` throws on keywords it does not know.
*   **Rationale:** Contract schemas with `minimum`, `pattern` or `minItems` would break `contract.int.spec`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I confirmed that the validator checks every keyword against a `KEYWORDS` set and throws on others.
*   ***Proposed Edit:***
    *   Location: table A intro
    *   Change: "Use only keywords that `apps/api/src/testing/json-schema.ts` supports. Extending the validator is out of scope."

### [Issue 34] [`style`] - Severity: Nit
*   **ID:** `style-1-3`
*   **Affected Scope:** Lines 591, 716, 482 (loose statements)
*   **Discrepancy Description:** Line 591 says no change is needed and that step 3 "proves it". The trainer-web plan tags `auth` as `type:util`. How a red `test` commit passes the hook is not stated.
*   **Rationale:** The statements read as contradictory.
*   ***AI Suggestion:*** PROPOSE FIX (the hook question is contested with evidence)
*   ***Justification:*** Wording and tag points are valid. On the hook: `.claude/hooks/commit-guard.mjs` defines `LINT_ONLY = new Set(['test', 'docs', 'ci'])` (line 6) and runs the test and coverage step only for other types (line 216), so a red `test` commit passes the hook by design.
*   ***Proposed Edit:***
    *   Location: after table H; Order of work note
    *   Change: "Expected to need no change. The skeleton's lint run verifies it." Add to the red-commit sentence: "The commit guard checks only lint for `test` commits (`commit-guard.mjs`)."

### [Issue 35] [`style`] - Severity: Nit
*   **ID:** `style-1-4`
*   **Affected Scope:** Line 650 (`Date.now()` claim)
*   **Discrepancy Description:** "The only reader of `Date.now()`" has no enforcement.
*   **Rationale:** An unenforced "only" claim can drift.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: table M, `clock.service.ts` row
    *   Change: Replace with "Other code in the library takes `now` from `ClockService`, and its spec fails if the page or stores call `Date.now()` directly (a spec that spies on `Date.now`)."

### [Issue 36] [`style`] - Severity: Nit
*   **ID:** `style-1-5`
*   **Affected Scope:** Lines 457, 466, 472, 482, 496, 529, 582, 644, 651, 715, 718 (wording)
*   **Discrepancy Description:** Filler sentence, placeholder `test(...)`, "`trainer` on `User`" matching no field, "and the like", "End-to-end API cases" colliding with `apps/e2e`, "Per the UI rule" without a source, a garbled `day-window.ts` sentence, "the same projects" and unmeasurable manual checks.
*   **Rationale:** Each reference should be checkable.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: lines as listed
    *   Change: Delete the line 457 sentence. Use "scope = the project name" for `test(...)` and `feat(...)`. Line 472: "the three trainer fields on `User`". Line 496: point to the contract block. Line 529: list the four codes (`trainer-not-approved`, `booking-expired`, `booking-withdrawn`, `booking-not-pending`). Line 582: "API integration cases". Line 644: "Per D16 and section 7.1 of `Architecture.md`". Line 651: a list of three functions (Block E). Line 715: "the projects listed above" (superseded by Issue 25). Line 718: "at a 375 px wide viewport; Tab order is greeting, requests top to bottom (Accept then Decline), sessions, sign-out".

---

## Edit blocks

### Block A: Order of work (replaces "Order of work" and the slice list)

| Step | Commit | Contents | Why it is green |
|---|---|---|---|
| 1 | `feat(api): add trainer home contract and skeleton` | Contract files and regenerated `api.d.ts`. New libs `trainers` and `booking` with stub controllers, services and guard that throw `Error('not implemented')`. `CodedHttpException` skeleton. `app.module.ts` wiring and backend path aliases in `tsconfig.base.json`. | Stub routes answer 500, not 404, so `contract.int.spec` passes. Each new lib sets `passWithNoTests` and ships one spec per stub that asserts it throws. |
| 2 | `feat(database): add trainer, venue and booking tables` | Schema files, `drizzle-kit generate --name trainer_home` output, `migrate.spec.ts` assertions. | Migration is generator output; the spec passes against it. |
| 3 | `feat(repo): add trainer home frontend skeleton` | Libs `trainer-access`, `feature-trainer-home`, `feature-trainer-setup` with stubs and `passWithNoTests`. `AuthService.refreshUser()` (abstract), the stub in `DevAuthService`, the resolving version in `UnconfiguredAuthService`. `ApiClient` method stubs. Frontend path aliases. Routes are not wired. | Existing route and app specs are untouched. Stub specs keep coverage at 80%. |
| 4 | `test(...)` then `feat(...)` per slice | Slices below. Scope in each message is the project name. | `test` commits check lint only (`commit-guard.mjs`); `feat` commits pass tests and coverage. |
| 5 | `docs(repo): record trainer home decisions` | Architecture, plan and README edits. | Docs commit. |

Slices: 1 `common` (coded exception, `code` in the filter); 2 `database` (seed, `testing.ts`, CLI); 3 `trainers` and `identity` (the three fields, guard, `me.int.spec.ts`, `dev-login.int.spec.ts`); 4 `booking` (lists, accept and decline, `contract.int.spec.ts`, `trainer-home.int.spec.ts`, `test-app.ts`); 5 `ui`; 6 `data-access` and `auth`; 7 `trainer-access`; 8 `feature-trainer-setup`; 9 `feature-trainer-home`; 10 `trainer-web` (routes and the two specs); 11 `e2e`.

### Block B: Public signatures (pseudocode)

```text
common
  CodedHttpException(status: number, code: string, message: string)   // body: { statusCode, message, code }
  ProblemDetails.code?: string        // filter copies `code` when the exception body has a string `code`

trainers
  type TrainerUserFields = { trainerStatus: TrainerStatus | null,
                             trainerStatusNote: string | null,
                             trainerVenueTimeZone: string | null }
  TrainersService.getUserTrainerFields(user: { id: string, role: Role }): Promise<TrainerUserFields>  // all null unless role is trainer
  TrainersService.isApproved(userId: string): Promise<boolean>
  TrainersService.venuesByIds(ids: string[]): Promise<Map<string, VenueSummary>>
  TrainerProfilesRepository.findProfile(userId): Promise<TrainerProfileRow | null>
  TrainerProfilesRepository.findOldestVenue(userId): Promise<VenueRow | null>
  TrainerApprovedGuard                // reads request.user.id, throws CodedHttpException(403, 'trainer-not-approved', ...)

booking
  BookingService.listPendingRequests(trainerId): Promise<BookingRequestListDto>
  BookingService.listSessions(trainerId, from: Date, to: Date): Promise<SessionListDto>
  BookingService.accept(trainerId, bookingId): Promise<BookingDto>
  BookingService.decline(trainerId, bookingId): Promise<BookingDto>
  BookingsRepository.pendingForTrainer(trainerId): Promise<{ rows: BookingRow[], serverTime: Date }>
  BookingsRepository.sessionsForTrainer(trainerId, from, to): Promise<{ rows: BookingRow[], serverTime: Date }>
  BookingsRepository.decide(trainerId, bookingId, action: 'accept' | 'decline'): Promise<DecisionResult>  // owns the transaction

frontend
  ApiClient.getBookingRequests(): Observable<BookingRequestList>
  ApiClient.getSessions(from: string, to: string): Observable<SessionList>
  ApiClient.acceptBooking(id): Observable<Booking>;  declineBooking(id): Observable<Booking>
  AuthService.refreshUser(): Promise<void>
  ClockService.now: Signal<number>               // epoch ms, server-corrected, ticks every second
  ClockService.sync(serverTime: string): void    // sets offset = Date.parse(serverTime) - Date.now()
  REFRESH_INTERVAL_MS = 30_000
  refreshTrigger(): Observable<void>             // each store subscribes to its own
  RequestsStore  (provided in TrainerHome's providers)
     cards: Signal<RequestCard[]>, loadState: Signal<'loading' | 'ready' | 'error'>, lastUpdated: Signal<number | null>
     accept(id), decline(id), refresh(), retry()
  SessionsStore  (provided in TrainerHome's providers)
     today: Signal<Session[]>, tomorrow: Signal<Session[]>, loadState: Signal<...>, refresh(), retry()
  fc-time:      inputs value (ISO string), timeZone (IANA string)
  fc-deadline:  inputs until (ISO string), now (epoch ms), timeZone
  fcScrollIntoView: selector [fcScrollIntoView], boolean input of the same name
```

### Block C: Database columns

All tables: `id uuid primary key default gen_random_uuid()` unless noted; timestamps are `timestamptz`.

*   `trainer_status` enum: `'incomplete','submitted','changes_requested','approved'` (literal list, as in `users.ts`).
*   `trainer_profiles`: `user_id uuid pk references users(id) on delete cascade`, `status trainer_status not null default 'incomplete'`, `status_note text null`, `created_at not null default now()`, `updated_at not null default now()`.
*   `venues`: `trainer_user_id uuid not null references users(id) on delete cascade`, `name text not null`, `area text not null`, `address text not null`, `instructions text null`, `time_zone text not null`, `created_at not null default now()`. Index on `trainer_user_id`. No unique constraint (one venue per trainer is an assumption, not approved).
*   `booking_status` enum: `'pending','confirmed','declined','expired','withdrawn','cancelled','completed'`.
*   `bookings`: `trainer_user_id`, `client_user_id` (both `uuid not null references users(id)`), `venue_id uuid not null references venues(id)`, `starts_at timestamptz not null`, `duration_minutes integer not null check (> 0)`, `price_minor integer not null check (>= 0)`, `currency char(3) not null`, `status booking_status not null default 'pending'`, `requested_at timestamptz not null`, `expires_at timestamptz not null check (expires_at > requested_at)`, `decided_at timestamptz null`, `created_at not null default now()`. Indexes: `(trainer_user_id, status, expires_at)`, `(trainer_user_id, status, starts_at)`, `(client_user_id, status)`.
*   `booking_status_changes`: `booking_id uuid not null references bookings(id) on delete cascade`, `from_status booking_status null` (null on creation), `to_status booking_status not null`, `changed_at timestamptz not null default now()`. Index on `booking_id`.
*   `migrate.spec.ts` asserts: the four tables with these column names and types, the two enums' values, the three bookings indexes, the three check constraints (each rejects a bad insert), and the delete cascades.

### Block D: Accept and decline

```text
decide(trainerId, bookingId, action):          // one transaction, READ COMMITTED
  1. target = SELECT client_user_id FROM bookings WHERE id = :id AND trainer_user_id = :trainer   // no lock
     none (also malformed id): 404
  2. locked = SELECT * FROM bookings
              WHERE client_user_id = target.client_user_id AND status = 'pending'
              ORDER BY id FOR UPDATE          // same lock order for every caller, so no deadlock
     (plus the target row if it is no longer pending: re-read it with FOR UPDATE after the above)
  3. booking = the target row as read after the lock
  4. Decision table below; "now" is clock_timestamp()
  5. UPDATE target; INSERT history row
  6. accept only: for each OTHER locked row with expires_at > now AND
       tstzrange(starts_at, starts_at + duration) && tstzrange(target.starts_at, target.starts_at + target.duration)
     set status 'withdrawn' and insert a history row. Ranges are half-open, so touching sessions do not overlap.
     Other rows with expires_at <= now are left as they are.
  7. log one JSON line; return the updated target
```

| Current status | Accept | Decline |
|---|---|---|
| `pending`, `expires_at > now` | confirm, 200 | decline, 200 |
| `pending`, `expires_at <= now` | 409 `booking-expired` | 409 `booking-expired` |
| `confirmed` | 200, no change | 409 `booking-not-pending` |
| `declined` | 409 `booking-not-pending` | 200, no change |
| `expired` | 409 `booking-expired` | 409 `booking-expired` |
| `withdrawn` | 409 `booking-withdrawn` | 409 `booking-withdrawn` |
| `cancelled`, `completed` | 409 `booking-not-pending` | 409 `booking-not-pending` |

The repository owns the transaction. Using `clock_timestamp()` keeps the deadline check correct after a lock wait. The accept transaction is the only place that writes `withdrawn` in this feature.

### Block E: Day window and time display

```text
sessions endpoint: confirmed bookings that OVERLAP [from, to):
    starts_at < to AND starts_at + duration_minutes * interval '1 minute' > from
  (so a session that started before `from` and is still running is returned; the client hides ended ones)

dayWindow(now: number, zone: string): { from: number, to: number }       // epoch ms
dayOf(startsAt: number, zone: string, now: number): 'today' | 'tomorrow' | null   // null outside both days
hasEnded(startsAt: number, durationMinutes: number, now: number): boolean   // true when startsAt + duration <= now

start of a zone-local date D = the earliest instant whose local date is D.
  Algorithm: read the zone's local Y-M-D of `now` with Intl.DateTimeFormat(..., { timeZone }).formatToParts;
  find the instant by searching from (UTC midnight of D) minus 14 h to plus 14 h for the first instant whose
  local date equals D. A day without local 00:00 (DST gap) therefore starts at the first existing instant.
  No date library is added.
```

Display: locale `en-GB` (one fixed constant `UI_LOCALE`, D13), 24-hour clock. `fc-time` renders "Thu 12 Nov, 10:00 CET" (`weekday`, `day`, `month`, `hour`, `minute`, `timeZoneName: 'short'`). The "Warsaw time" wording is dropped everywhere. `fc-deadline` renders "Respond by 14:30 CET, 42 min left"; minutes left is rounded up, under one minute shows "less than 1 min left", and at or past `until` shows "Expired". `lastUpdated` shows "HH:mm" in the venue zone. `hasEnded` test: a session ending exactly at `now` is ended. `dayWindow` tests also cover a zone whose midnight does not exist.

### Block F: Card state machine and stores

| State | Event | Next state |
|---|---|---|
| `idle` | tap Accept or Decline | `submitting` (action kept) |
| `idle` | clock reaches `expiresAt` | `expired` (disabled card; store refetches once) |
| `submitting` | 200 | `accepted` or `declined` (snapshot kept) |
| `submitting` | 409 `booking-expired`, `booking-withdrawn`, `booking-not-pending` | `unavailable` (store refetches once) |
| `submitting` | 404 | `unavailable` |
| `submitting` | 403 `trainer-not-approved` | `refreshUser()`, then navigate to `/setup` unless still approved, in which case `failed` |
| `submitting` | network error or 5xx | `failed` ("Not sent. Try again"; both buttons enabled) |
| `failed` | tap | `submitting` |
| `accepted`, `declined`, `unavailable`, `expired` | none | stay until the page is left |

*   `RequestsStore` keeps `Map<id, CardView>`. A poll merges by id: cards in `submitting` keep their state (the response is not applied to them), resolved cards (`accepted`, `declined`, `unavailable`, `expired`) stay in place even after the server list drops them, and new ids from the server are added as `idle`, sorted by `expiresAt` with resolved cards after open ones.
*   Refresh uses `exhaustMap`: a new trigger while a request is in flight is ignored.
*   The refetch at the deadline and after a 409 is triggered by the store, once per card.
*   Both stores are provided in `TrainerHome`'s `providers`, so they live until the page is left.
*   `SessionsStore` handles a 403 `trainer-not-approved` the same way as `RequestsStore`.

### Block G: Seed and e2e

Dev seed (`seedDevTrainerData(db, now: Date)`, same `NODE_ENV` guard as `seedDevUsers`):

*   New `SEED_USERS` entry: `pat.pending@example.com`, "Pat Pending", role `trainer`, password `password` (so `SEED_USERS` has 4 users).
*   Profiles: `trainer@example.com` approved; `pat.pending@example.com` submitted.
*   Venue for Taylor: "Riverside Studio", area "Powisle", address "12 Example Street", instructions "Ring the bell at the gym entrance", zone `Europe/Warsaw`.
*   Bookings for Taylor from `client@example.com`, price 6000 minor, `PLN`, 60 minutes: pending A starts `now + 5 h`, requested `now - 5 min`, expires `now + 55 min`; pending B starts `now + 2 h` (inside the late window), requested `now - 10 min`, expires `now + 50 min`. A and B do not overlap. Confirmed C starts `now - 15 min` (in progress); confirmed D starts at tomorrow noon in the venue zone.
*   Reset: delete the bookings of the seeded trainers (history rows cascade), then insert. `cli/seed.ts` runs `(db) => seedDevTrainerData(db, new Date())` after `seedDevUsers`.
*   `seed.spec.ts`: assertions change to 4 users and 4 credentials; add cases for the profiles, the venue, the four bookings, the guard, and an idempotent re-run.

e2e (option a, proposed): `apps/e2e/src/db.ts` (Create) exports `createBooking(options)` and `expireBooking(id)` using `pg` and `E2E_DATABASE_URL` from `stack.ts`, returning ids to the test. Each trainer-home scenario creates its own bookings first. Today's session starts 5 minutes before now and lasts 60 minutes, so it is in progress when the test runs. Tomorrow's session starts at noon of tomorrow's venue date (found with `Intl.DateTimeFormat` parts), which avoids the DST gap. `apps.ts` gains optional `unapprovedTrainer: { email, displayName }` for the trainer app. `trainer-home.e2e.ts` starts with `test.skip(app.name !== 'trainer-web')`.

### Block H: Shared UI additions and page copy

Additions to table J: `fc-list` and `fc-list-item` (`ul` and `li` semantics, `fc-list` takes an accessible label). `fc-page align="top"` content has a maximum width (the `3xl` spacing token equivalent already in `tokens.css`; if none exists, add one token and a test first). `fc-card size="full"` fills that width.

Heading levels: greeting `h1` ("Welcome, {name}"), list sections `h2`, per-card client name `h3`.

| Where | Text |
|---|---|
| Requests heading | "Booking requests" |
| Requests loading | "Loading booking requests…" |
| Requests empty | "No booking requests right now." |
| Requests error, no data | "We could not load booking requests." with a "Try again" button |
| Requests error, with data | "Could not refresh. Showing the update from {HH:mm}." |
| Sessions heading, groups | "Upcoming sessions"; "Today"; "Tomorrow" |
| Sessions loading, empty | "Loading sessions…"; "No sessions today or tomorrow." |
| Sessions error | "We could not load your sessions." with "Try again" |
| Venue time zone missing | "Your venue time zone is not set, so sessions cannot be shown." |
| Buttons | "Accept", "Decline" |
| After answer | "Accepted. {fc-time}" / "Declined." / "This request is no longer available." / "Expired." / "Not sent. Try again." |
| Late caption | "Starts within 3 hours of your reply. Cancelling later will be flagged." |
| Deep-link notice | "That request is no longer available. It may have expired or been answered." |

`/setup` copy:

| Status | Heading | Body |
|---|---|---|
| `incomplete` | "Your profile is not ready yet" | "You cannot receive booking requests until your profile is submitted and approved." |
| `submitted` | "Your profile is under review" | "An admin is reviewing your profile. Use Check again to see the latest status." |
| `changes_requested` | "Changes needed" | "An admin asked for changes: {trainerStatusNote}." If the note is empty: "An admin asked for changes." |
| `null` or missing | "We could not read your status" | "Use Check again to try once more." |

`approved` has no copy: the page navigates to `/`. `fcScrollIntoView` sets `tabindex="-1"` on its host element, scrolls it into view and focuses the host.

### Block I: Test cases

*   **`common`:** `CodedHttpException` keeps status, message and code; the filter copies `code` and omits it otherwise.
*   **`trainers`:** `getUserTrainerFields` for client and admin (all `null`), trainer without profile (`incomplete`, venue time zone `null`), trainer with each status, note present or absent, several venues (oldest wins); the guard allows only `approved`, and throws 403 with the code otherwise.
*   **`booking` repository and service (real Postgres):** pending list excludes expired-by-time, other trainers, other statuses and sorts by `expires_at`; `expires_at == now` is excluded; sessions list is overlap-based, `from` inclusive and `to` exclusive for the overlap, exactly 7 days accepted and 7 days plus 1 ms rejected; accept and decline for each row of the decision table; repeat accept and repeat decline; accept racing expiry (the deadline passes during the lock wait); two trainers accepting one client's overlapping requests concurrently ends with exactly one confirmed and the other withdrawn, with no deadlock; touching ranges stay pending; an expired overlapping request is left alone; every change writes a history row.
*   **`booking` controllers and `trainer-home.int.spec.ts`:** 401 without a token, 403 for a client and for an unapproved trainer (code `trainer-not-approved`), 404 for another trainer's booking and for a malformed id, 400 for a bad query, response shapes validated against the contract, no `address` field anywhere.
*   **`contract.int.spec.ts`:** every new path is served and conforms for its documented statuses.
*   **`ui`:** `fc-time` shows the zone label and a `<time datetime>`, and renders across a DST date; `fc-deadline` shows minutes rounded up, "less than 1 min left" and "Expired" at the boundary; `fcScrollIntoView` focuses and scrolls when the input becomes true and not before (`scrollIntoView` stubbed in `test-setup.ts`); `fc-card` highlighted and size; `fc-page` align; `fc-list` and `fc-list-item` roles.
*   **`data-access` and `auth`:** each new `ApiClient` method (URL, method, error mapping), `ApiError.code`, `refreshUser()` success, rejection with the user kept, and no sign-out on its own.
*   **`trainer-access`:** the decision table, plus a trainer with `trainerStatus` `null`.
*   **`ClockService`:** `sync` sets the offset, `now` ticks each second (fake timers), and a skewed device clock does not move the result.
*   **`refreshTrigger`:** emits on start, emits again after `REFRESH_INTERVAL_MS` while visible, emits on becoming visible, and emits nothing while hidden.
*   **`RequestsStore` and `request-card-state`:** every row of the transition table; a poll never overwrites a `submitting` card; resolved cards survive a poll that drops them; a failed refresh keeps the last list; with no data it shows the error state, not the empty state; `exhaustMap` ignores an overlapping trigger; 403 navigates to `/setup`.
*   **`SessionsStore`:** groups by `dayOf`, hides ended sessions as the clock passes the end, error when the venue time zone is `null`, 403 handling.
*   **`TrainerHome`:** loading, empty, error and loaded states for both lists, the late caption on a card inside 3 hours only, highlight once after the first successful load, notice for an unknown id, sign-out.
*   **`TrainerSetup`:** each status text, the note fallback, "Check again" success and failure, navigation to `/` when approved.
*   **`trainer-web`:** the route table (signed out, wrong role, approved, unapproved, `**`), and `returnUrl` keeps `?request=<id>`.
*   **e2e:** the scenarios listed in table O, each creating its own data.
