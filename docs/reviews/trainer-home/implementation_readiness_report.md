# Goldfish Review Report

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/designs/trainer-home.md` (`lines 455-722`, section "## Detailed Implementation Plan" to end of file)

Mode: REVIEW. Text above line 455 was context only. Line numbers below are in the target file. Findings were deduplicated across reviewers. Each finding carries the id of the reviewer that reported it first, and an "Also reported by" note where others overlapped. Ids are stable (`<reviewer>-1-<n>`).

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `implementation-readiness` | completed |
| `codebase-details` | completed |
| `style` | completed |

Counts after deduplication: 3 Blockers, 23 Majors, 11 Nits (37 findings).

Verified correct by the codebase reviewer (no finding): every file marked Modify exists; the scripts `contract:lint`, `contract:types`, `db:generate`, `db:seed`, `check:prod-bundles`, `dev:infra` exist; the new libs' tags satisfy the `depConstraints` in `eslint.config.mjs` (the claim at line 591 that no boundary change is needed holds); inline templates in libs are covered by the raw-HTML lint rule.

Overall verdict (implementation readiness): not ready. The file tables are accurate and complete. The gaps are in commit ordering under the commit guard, concurrency, seed and e2e data, public signatures, and test cases.

## Prioritized Findings (Blockers -> Major -> Nits)

### Step 1 cannot be committed green - Severity: Blocker
* **ID:** `implementation-readiness-1-1`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `461-463`, `469-480`, `581`
* **Discrepancy Description**: Step 1 is a `feat(api-contract)` commit that adds four paths to the contract, but the controllers arrive in step 3 and slice 3. `apps/api/src/app/contract.int.spec.ts` (lines 51-68) loops over every contract path and fails on a 404. Unmatched Nest routes return 404, so the `api` project goes red after step 1.
* **Rationale & Recommendation**: `.claude/rules/workflow.md` and `.claude/hooks/commit-guard.mjs` require every non-`test`/`docs`/`ci` commit to leave affected projects green, so the guard blocks this commit. Move stub controllers into step 1, merge the API part of steps 1 and 3, or state how the spec stays green in that commit.

### Step 3 skeleton fails the commit guard on tests and coverage - Severity: Blocker
* **ID:** `implementation-readiness-1-2`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `465`, `482`, `479`
* **Discrepancy Description**: Step 3 (`feat(repo): add trainer home skeleton`) adds five libraries of `throw new Error('not implemented')` stubs, routes and module wiring. A `feat` commit must pass tests and the 80% per-project coverage gate. The plan does not say how the new libs pass before slice 4 adds tests (the existing `identity` project uses `passWithNoTests` in `project.json`). The trainer-web route change also breaks the existing `app.routes.spec.ts` (lines 73-93) and `app.spec.ts`, whose fixtures have no `trainerStatus` and which expect `fc-signed-in-home`, the old seed data and the old login description. The plan first touches these specs in slice 9 (line 479).
* **Rationale & Recommendation**: Give a file-to-commit mapping. Either keep trainer-web route changes out of step 3, or update the affected specs in the same commit. State `passWithNoTests` (or equivalent) for stub-only libs, and say how `MeController`, `AuthService` and the routes are stubbed so existing specs stay green.

### Seed data cannot satisfy the e2e scenarios or the manual check - Severity: Blocker
* **ID:** `codebase-details-1-1`
* **Reviewer Lens:** `codebase-details` (also `implementation-readiness`)
* **Affected Scope:** `521-523`, `670`, `582`, `718`
* **Discrepancy Description**: The seed creates two pending requests. The e2e scenarios (accept, decline, lost race, signed-out deep link, "sees both lists") need at least four distinct pending requests, and they mutate the shared, never-reset `fitness_connect_e2e` database. `playwright.config.ts` uses `workers: 1` and `retries: 1` on CI, so a retry finds the data already consumed. The plan does not say whether the pending requests overlap (two overlapping requests from one client would make accepting one withdraw the other, PDR-018, and break the decline scenario). It does not say which request starts within 3 hours (needed for the late caption in the manual check), nor how "confirmed today" is placed: at 23:30 Warsaw time no session can be today and not yet ended.
* **Rationale & Recommendation**: Decide between per-test fixtures created through the database, or more seed rows with fixed ids and explicit start times relative to `now`. State the placement rule for today's and tomorrow's sessions so the e2e is not clock-dependent.

### Slices do not cover `database` and `api`; `testing.ts` missing; seed split unclear - Severity: Major
* **ID:** `implementation-readiness-1-3`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `463`, `469-480`, `508-523`, `521`, `574-583`, `714`
* **Discrepancy Description**: Step 2 only creates a "seed stub", and the schema is hand-written logic before any test. `seed.spec.ts`, `migrate.spec.ts`, `cli/seed.ts` and the real `seedDevTrainerData` appear in no red/green slice. The `api` int specs (`me.int.spec`, `dev-login.int.spec`, `contract.int.spec`, `trainer-home.int.spec`), `test-app.ts` and `app.module.ts` are not assigned to a slice; slice 2 changes the `User` DTO that `me` and dev-login specs exercise. `libs/backend/database/src/lib/testing.ts` (`prepareTestDatabase` calls only `seedDevUsers`) is missing, so API int specs run without trainer profiles, yet line 579 expects `approved` and `submitted` trainers. `tsconfig.base.json` path aliases for the new libs have no step. Step 2 says "seed stub" while table B (line 521) specifies the full `seedDevTrainerData`; which commit carries which part is unstated.
* **Rationale & Recommendation**: Add red/green slots for database and api work, add `testing.ts` (and its spec) to the plan, and put the path aliases in the skeleton step. State which commit holds each part of the seed.

### Scaffolding of new libraries is undefined - Severity: Major
* **ID:** `implementation-readiness-1-4`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `537`, `561`, `621`, `629`, `642`, `716`
* **Discrepancy Description**: "Using the options of `libs/backend/identity`" and "check the generator's `--help`" leave generator name, flags, directory, import path, tags, prefix, test runner and linter to the implementer. The `feature-trainer-setup` and `feature-trainer-home` libs have no scaffolding description at all. Required hand edits are unlisted: 80% thresholds in `jest.config.cts` / `vite.config.mts`, `testTimeout: 30000`, `transformIgnorePatterns` for `jose` (see `libs/backend/identity/jest.config.cts` lines 9-11), `collectCoverageFrom`, `passWithNoTests`, tags in `project.json`. Line 716 treats thresholds as already set in each project config; a generator gives new libs none.
* **Rationale & Recommendation**: Give exact generator commands or list every generated and edited file. This is the workflow's skeleton step and should be reproducible.

### Public signatures needed by the skeleton are missing - Severity: Major
* **ID:** `implementation-readiness-1-5`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `529-533`, `541-546`, `565-572`, `611-612`, `641-655`
* **Discrepancy Description**: Stubs must compile, so these must be fixed in the plan: the `CodedHttpException` constructor and how the filter reads `code`; `ProblemDetails.code` in `problem-details.filter.ts`; repository, `BookingService` and `TrainersService` method names, parameters and returns; the `ClockService` API (how a response's `serverTime` syncs the offset, the `now` type); store public APIs (`accept(id)`, `decline(id)`, signal names, per-card state accessor); the `fcScrollIntoView` input name; new UI component class names; the type of `fc-deadline` `until` (the plan states `now` as epoch ms, not `until`); whether the refresh trigger is an Observable or a function and whether both stores share one instance.
* **Rationale & Recommendation**: Add a signatures block per lib. Without it, the implementer makes API-shaping decisions that the tests then lock in.

### `getUserTrainerFields(userId)` cannot tell a trainer from a client - Severity: Major
* **ID:** `implementation-readiness-1-6`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `543-544`, `553-554`, `626`
* **Discrepancy Description**: The method takes only `userId`, and a missing profile row reads as `incomplete` (line 543). It must return all `null` for non-trainers, but the `trainers` lib has no role input. The plan does not say whether the caller passes the role or the service reads `users` (a cross-module table read). The type of `trainerFields` in `toUserDto(user, trainerFields)` is unnamed. `trainerVenueTimeZone` for a trainer with several or no venue rows is unspecified. The guard table has no row for role trainer with status `null` (fixtures omit the optional fields), so it is unclear whether `null` means `/setup` or home.
* **Rationale & Recommendation**: Fix the signature (pass role or return a discriminated result), name the DTO type, define venue selection, and add the `null`-status guard row.

### Accept transaction has an unspecified concurrency design - Severity: Major
* **ID:** `implementation-readiness-1-7`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `683-699`
* **Discrepancy Description**: Only the one booking row is locked `FOR UPDATE`, then the same client's other overlapping pending bookings are updated. Two trainers accepting the same client's overlapping requests lock one row each and then update each other's row: a deadlock, or two confirmed overlapping sessions if the updates are not conditional. This is what PRD acceptance item 5 and PDR-018 forbid. No lock order, isolation level or deadlock handling is given. The overlap predicate compares only against this booking's range and does not say the other booking's duration is used (half-open on both sides). Pending rows past `expires_at` but not yet `expired` are not addressed (withdraw, leave, or mark). Postgres `now()` is the transaction start time, so the deadline check can pass after the deadline when the lock waited; `clock_timestamp()` or acceptance of the gap is not stated. Who opens the transaction (repository, line 567, or service, line 568) is unstated.
* **Rationale & Recommendation**: Specify a lock order (for example, lock all of the client's candidate rows ordered by id), the isolation level, the full overlap predicate, expiry handling and the transaction owner.

### Decline pseudocode is wrong for decline - Severity: Major
* **ID:** `style-1-1`
* **Reviewer Lens:** `style` (also `implementation-readiness`, `codebase-details`)
* **Affected Scope:** `683-684`, `688`, `695-696`, `698`
* **Discrepancy Description**: Line 683 says "decline is the same with `declined`". Line 688 returns the booking when status is `confirmed` as a "repeat call"; for decline the repeat branch must test `declined`, and a decline on a `confirmed` booking must be 409 `booking-not-pending` (Technical Plan line 222). Lines 695-696 withdraw the client's other overlapping pending requests, which belongs to accept only (PDR-018). Line 698 returns `booking` after the UPDATE without saying it is the updated row. Only the success path logs (line 697); the Technical Plan (line 223) requires info logs for 403 and 409.
* **Rationale & Recommendation**: Parameterise the target status or give a separate decline block with its decision table. Say which steps are accept-only.

### Database column types, constraints and migration naming are missing - Severity: Major
* **ID:** `implementation-readiness-1-8`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `508-523`, `517-520`
* **Discrepancy Description**: Tables list column names only. Missing: types (`uuid`, `timestamptz`, `price_minor` int or bigint, `char(3)` currency), nullability, defaults, FK `ON DELETE`, enum names, unique constraints (none on `venues.trainer_user_id`, although one venue per trainer is assumed), CHECKs (`expires_at > requested_at`, `duration_minutes > 0`, `price_minor >= 0`), an index on `client_user_id` for the overlap query, and whether `booking_status_changes.from_status` is nullable on creation. `migrate.spec.ts` (line 520) asserts "the new tables, enums and indexes", which cannot be written without these. Enum values must be literal lists as in `libs/backend/database/src/lib/schema/users.ts` (lines 4-16), because drizzle-kit loads schema files without path aliases; the plan omits this. Line 517 says generate then rename; existing names (`0000_enable_postgis`, `0001_create_users`) show a custom name, and renaming a generated file breaks the `_journal.json` tag. Line 519 says only "Generated entry".
* **Rationale & Recommendation**: Add a column spec per table, list literal enums, and use `drizzle-kit generate --name` (check `--help`) or state the journal and snapshot edits.

### Seed details left open - Severity: Major
* **ID:** `implementation-readiness-1-9`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `521-523`, `670`, `718`
* **Discrepancy Description**: Not given: the second trainer's email and display name, the client, venue name, area, address and instructions, prices, currency, durations, session times, `requested_at`, the `client_user_id` of seeded bookings. "Re-running resets the seeded bookings" has no mechanism (fixed UUIDs, or delete by trainer, and the fate of history rows). It is unstated whether `seedDevTrainerData` has the same `NODE_ENV` guard as `seedDevUsers` (`seed.ts` lines 30-36). `runWithDatabase('db:seed', task)` passes `task(db)` only, so `cli/seed.ts` needs a wrapper supplying `new Date()`. Adding a trainer to `SEED_USERS` breaks the existing `seed.spec.ts` assertions (3 users and credentials, ordering, lines 26-33, 55, 62); line 522 says only "cover the new users".
* **Rationale & Recommendation**: List the seed rows with values, the reset mechanism, the guard, the CLI change and the `seed.spec.ts` updates.

### e2e mechanics cannot run as written - Severity: Major
* **ID:** `implementation-readiness-1-10`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `665-671`
* **Discrepancy Description**: The e2e suite never learns booking ids (no API lookup or DB helper), but the deep-link scenario needs one. `global-setup.ts` seeds once per run, and nothing resets state between scenarios or retries. "Expires the request through the database" needs a `pg` helper using `E2E_DATABASE_URL` from `stack.ts`; that file is not in table O. `trainer-home.e2e.ts` "runs for trainer-web only" (line 670), but `playwright.config.ts` runs every `*.e2e.ts` for all three projects; the skip or `testMatch` mechanism and config change are not given. The `AppUnderTest` interface in `apps.ts` has no field for the second trainer account. `login.e2e.ts` asserts exactly one `h1` (strict mode), and the plan gives no heading levels for the home page, which must use `level=2` for section headings.
* **Rationale & Recommendation**: List the helper, the config change, the interface change and the heading levels, and tie them to the seed decision in `codebase-details-1-1`.

### Contract files lack field-level schemas and operation details - Severity: Major
* **ID:** `implementation-readiness-1-11`
* **Reviewer Lens:** `implementation-readiness`
* **Affected Scope:** `490-505`
* **Discrepancy Description**: "Pending request card fields" and "Confirmed session card fields" give no types, formats (`date-time`, `uuid`, ISO 4217), `required` lists, minimums or nullability. `operationId`s appear only in the Technical Plan. Parameter definitions for `from`, `to`, `{id}` and path tags are missing. The OpenAPI 3.1 nullable form for `trainerStatus` is not described. `Problem.yaml` `code` is "optional string" with no statement on whether known codes are an enum or examples. Line 491 says trainers "always get" the three fields while the schema stays optional.
* **Rationale & Recommendation**: The contract is the source of truth (D17). Give the schemas, or point to the exact contract block in the Technical Plan.

### Accept and decline: 400 is checked but not documented; query parameter rules open - Severity: Major
* **ID:** `codebase-details-1-2`
* **Reviewer Lens:** `codebase-details` (also `implementation-readiness`, `style`)
* **Affected Scope:** `503-504`, `570-571`
* **Discrepancy Description**: The accept and decline path files list 200, 401, 403, 404, 409, 500, but the controller does a "UUID check on `id`", which returns 400 for a malformed id. `contract.int.spec` checks documented statuses (`expectConforms`), so the 400 fails conformance. The repo convention (`users.repository.ts` line 24) treats a malformed id as not found. Also unspecified: whether `from` and `to` (line 571) must carry `Z` (`IsISO8601` accepts date-only and offset forms), the source of `serverTime`, and its consistency with the list in the same query.
* **Rationale & Recommendation**: Choose 400 or 404 and make the contract and the controller agree. Specify the timestamp format and `serverTime` source.

### Day-window algorithm, dependency and edge cases are open - Severity: Major
* **ID:** `implementation-readiness-1-12`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `651`, `701-708`
* **Discrepancy Description**: "Local midnight in zone as UTC instant" has no library choice or algorithm; `package.json` has no date library and `tsconfig.base.json` `lib: es2022` has no `Temporal`. `Intl.DateTimeFormat` alone needs an offset-search algorithm, and the DST case where local midnight does not exist is unaddressed. A session that starts before `from` but is still running (23:30-00:30) falls outside the `startsAt >= from` filter, contradicting the Goal and Decision 9 that an in-progress session stays until it ends. The test case "a session ending exactly at `now`" lacks the expected result (state `hasEnded` is true when `startsAt + duration <= now`; line 263 says "has passed" and line 612 "reaches"). Types of `startsAt` and `now` (ISO string or epoch ms) and the return of `dayOf` for an instant outside today and tomorrow are not given. The line 651 sentence is garbled (see `style-1-5`).
* **Rationale & Recommendation**: Name the dependency or the `Intl` algorithm, decide the look-back behaviour and the DST gap, and give the types and boundary rule.

### Zone label, locale and rounding rules for time display are undefined - Severity: Major
* **ID:** `implementation-readiness-1-13`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `611-612`, `259`
* **Discrepancy Description**: The examples "14:30 CET" and "Thu 10:00 Warsaw time" mix two label styles. `Intl.DateTimeFormat` with `timeZoneName: 'short'` gives "CET" in `en-GB` but "GMT+1" in `en-US`, and "Warsaw time" cannot come from `Intl` zone names. Locale, hour cycle, date style, weekday and how "N min left" rounds (floor or ceil, below one minute) are not given, so `fc-time` and `fc-deadline` specs cannot assert exact strings. `lastUpdated` "HH:mm" has no zone or locale.
* **Rationale & Recommendation**: Fix locale and format options and the city-label source, and state the rounding rule.

### Request-card state machine and per-card result retention are undefined - Severity: Major
* **ID:** `implementation-readiness-1-14`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `644-655`
* **Discrepancy Description**: `request-card-state.ts` lists six states but no events or transitions, and the "Expired" card at the deadline (line 262) is a seventh not in the machine. A resolved card is "kept until the page is left", yet the next refresh removes it from the server list, and the 409 "unavailable" case refetches immediately. The plan does not say where the snapshot is kept (a map keyed by id), how it merges with the polled list or sorts, how a `submitting` card is protected from a poll overwrite, whether refresh uses `switchMap` or `exhaust`, who triggers the refetch at the deadline (and after a 409, lines 259, 262), or the handling of 404 and other 4xx on accept. Stores kept "until the page is left" must be provided at component level, not as root services; the plan does not say so. `requests-store.ts` lists `refreshUser()` on a 403 but `sessions-store.ts` (line 654) does not, although both endpoints return that 403.
* **Rationale & Recommendation**: Add a transition table, the snapshot model, the in-flight rules and the store provision scope.

### No navigation follows a 403 `trainer-not-approved` on the home page - Severity: Major
* **ID:** `implementation-readiness-1-15`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `600`, `653-655`, `661`
* **Discrepancy Description**: `RequestsStore` calls `refreshUser()` but no step navigates. On home the URL is already `/`, and Angular ignores a navigation to the same URL unless `onSameUrlNavigation: 'reload'` and `runGuardsAndResolvers: 'always'` are set, or the code navigates directly to `/setup`. `app.config.ts` is not in table N. The route plan (line 661) uses flat route guards, while the Technical Plan (line 245) says approved-only routes sit under one parent route. Line 634 says the page navigates when status "becomes `approved`" and line 247 says "the status changed"; align them.
* **Rationale & Recommendation**: State who calls what, with which router settings, and the route structure.

### Deep-link handling has no file row and is underspecified - Severity: Major
* **ID:** `implementation-readiness-1-16`
* **Reviewer Lens:** `implementation-readiness` (also `style`)
* **Affected Scope:** `613`, `649`
* **Discrepancy Description**: The deep-link handling is assigned to the library (Technical Plan line 233) but has no file row. It is not stated how `?request=` is read (`ActivatedRoute` or input binding, which needs `app.config.ts`). "After the first load" is ambiguous if the first load fails, and whether the highlight fires once or after later polls is open. When the notice is removed (on user action) and its timing are unspecified.
* **Rationale & Recommendation**: Assign the deep-link logic to a file row and define read, timing and dismissal rules.

### New shared UI components and page copy are incomplete - Severity: Major
* **ID:** `implementation-readiness-1-17`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `605-617`, `626`, `634`, `636-641`
* **Discrepancy Description**: No loading indicator component (`fc-button` has a spinner, there is no standalone one), no `fc-list` for card list semantics (a raw `ul` is not allowed), no max-width or padding for `fc-page align="top"` / `fc-card size=full` (lists stretch on desktop), no empty-state components. Missing copy and structure: list headings, Today and Tomorrow headings, loading, empty, error and retry texts, Accept and Decline labels, heading levels (`fc-heading` defaults to level 1, and `login.e2e.ts` line 38 expects a single `h1`). In the setup copy table: the `changes_requested` body says "Reason shown from `trainerStatusNote`" (a spec note, not copy); the `incomplete` body "Your account is waiting for it" has an unclear referent and no action; `approved` has no row (the page redirects); the fallback when `trainerStatusNote` or the status is `null` is not given. `fcScrollIntoView` needs a spec for what receives focus with `tabindex="-1"` on a custom-element host.
* **Rationale & Recommendation**: Specify the missing components and give the copy table, heading levels and fallbacks.

### Many specs list no test cases - Severity: Major
* **ID:** `implementation-readiness-1-18`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `482`, `543-546`, `567-572`, `611-617`, `626-627`, `634`, `649-655`, `662-663`
* **Discrepancy Description**: The standard requires specific cases. Only `day-window`, the guards table, `trainer-home.int.spec` and the e2e scenarios list them. Entries saying only "Create" or "Cover": `trainer-home.spec`, `clock.service.spec`, `refresh-trigger.spec`, `requests-store.spec`, `sessions-store.spec`, `request-card-state.spec`, `trainer-setup.spec`, `bookings.repository.spec`, `booking.service.spec`, the UI specs, `app.routes.spec`. Missing cases include concurrent accept and decline of one booking, accept versus expiry, repeat accept and repeat decline, the deadline boundary (`expires_at == now`), overlap boundaries (touching ranges), `from` inclusive and `to` exclusive, exactly 7 days, refresh-trigger while hidden and on visible, the deadline flip to "Expired", a failed refresh keeping the previous list, and each 409 code mapped to a card state. jsdom lacks `Element.prototype.scrollIntoView`, so the directive spec needs a stub in the `ui` `test-setup.ts`; that infrastructure is not planned.
* **Rationale & Recommendation**: Add concrete cases per spec file and the test-setup change.

### Login description change impact on existing specs is not listed - Severity: Major
* **ID:** `implementation-readiness-1-19`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `661-663`, `671`
* **Discrepancy Description**: Line 661 changes the login description. `app.routes.spec.ts` lines 104-106 assert 'Manage your clients, schedule and earnings.', and its home assertions (lines 73-93) need `trainerStatus: 'approved'` in fixtures; `ApiClient` is stubbed with only `getMe`. The plan says only "cover the routing table". Line 671 says `login.e2e.ts` and `landing.e2e.ts` need no change and justifies it only by the home heading and email text; if either reads the login description, the claim is wrong (unverified).
* **Rationale & Recommendation**: Name the assertion and fixture changes, and either state that the e2e specs do not assert the login description or list them under Modify.

### `AuthService.refreshUser()` has no skeleton step or 401 reconciliation - Severity: Major
* **ID:** `implementation-readiness-1-20`
* **Reviewer Lens:** `implementation-readiness`
* **Affected Scope:** `600-602`
* **Discrepancy Description**: Adding an abstract method breaks every implementer and typed test double until all are updated. Slice 5 adds it after the skeleton, so the `auth` project cannot stay compilable. The 401 handling inside `refreshUser()` (sign out, as in `restoreSession`) overlaps with the interceptor (`auth-interceptor.ts` lines 33-40, which already signs out on a 401 while authenticated).
* **Rationale & Recommendation**: Move the method and test-double updates into the skeleton, and state whether `refreshUser()` calls `signOut()` or leaves it to the interceptor.

### `booking` lib reads other modules' tables - Severity: Major
* **ID:** `codebase-details-1-3`
* **Reviewer Lens:** `codebase-details`
* **Affected Scope:** `566-568`, `543-544`
* **Discrepancy Description**: `Architecture.md` line 97 says cross-module calls go through public APIs and never through another module's tables. The pending list and sessions need the client's name (`users`, owned by `identity`) and venue fields (`venues`, owned by `trainers`), so `bookings.repository` would join other modules' tables. The plan does not say whether this is allowed via the shared `database` lib or must go through public APIs. `venues.trainer_user_id` is not unique, so the venue returned for a trainer with several is also open.
* **Rationale & Recommendation**: This is an architecture decision with impact on module boundaries. Record it and update `Architecture.md` if an exception is made.

### Verification project list is incomplete - Severity: Major
* **ID:** `codebase-details-1-4`
* **Reviewer Lens:** `codebase-details` (also `implementation-readiness`, `style`)
* **Affected Scope:** `710-718`, `716`
* **Discrepancy Description**: The `-p` list omits dependents of changed shared code: `feature-login`, `feature-home`, `client-web`, `admin-web`. `fc-card` and `fc-page` change in `ui`, and `AuthService` gains an abstract member, which affects test doubles there. Raw-HTML lint, coverage and build checks also apply. Line 716 says "`vite.config.mts` or Jest config" without naming which project uses which, and repeats the 80% rule that line 482 states.
* **Rationale & Recommendation**: Use `nx affected -t test lint build` or extend the list; name the config per project and drop one copy of the coverage rule.

### `/setup` is said to supersede routes it does not replace - Severity: Major
* **ID:** `style-1-2`
* **Reviewer Lens:** `style`
* **Affected Scope:** `678`, `49` (Non-Goals, context)
* **Discrepancy Description**: The row tells the trainer-web plan that `/setup` and the home "supersede the `/onboarding`, `/verification` routes and the stats dashboard row". `/onboarding` is a multi-step profile form and Non-Goals line 49 defers profile and verification-submission screens; `/setup` is read-only. At most the verification-status screen is partly replaced, and the plan's `/` row ("Dashboard: today's sessions, requests, quick stats") is narrowed, not superseded.
* **Rationale & Recommendation**: Name exactly which rows of `docs/plans/trainer-web.md` change and how. Do not call `/onboarding` superseded.

### `dev-auth.controller.ts` row is misleading - Severity: Nit
* **ID:** `implementation-readiness-1-21`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`)
* **Affected Scope:** `556`
* **Discrepancy Description**: The controller returns the service result unchanged (`dev-auth.controller.ts` lines 14-16). The trainer fields are added in `dev-auth.service.ts`, which needs `TrainersService` injected. "Pass the trainer fields through" has no controller change to make.
* **Rationale & Recommendation**: Remove the controller Modify row, or say what changes, and list `dev-auth.service.ts` instead.

### Documentation entries are vague and some READMEs are missing - Severity: Nit
* **ID:** `implementation-readiness-1-22`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `467`, `677-679`, `603`
* **Discrepancy Description**: "Record the new decisions" and "and section 11" give no wording or row ids; "Architecture, plan and library READMEs" does not name files. The `libs/frontend/data-access/README.md` (ApiClient method table, lines 12-14) and the root `README.md` (lines 44-45, seed users) are not in the plan.
* **Rationale & Recommendation**: Name the new `D` rows and the exact edits to `Architecture.md` sections 2, 5, 6.3 and 11, `docs/plans/trainer-web.md`, and add the two READMEs.

### Logging format and rejection logging are unspecified - Severity: Nit
* **ID:** `implementation-readiness-1-23`
* **Reviewer Lens:** `implementation-readiness` (also `style`)
* **Affected Scope:** `568`, `697`
* **Discrepancy Description**: "One structured line" has no format (JSON keys, level, Nest `Logger` name). Info logs for 403 and 409 rejections (Technical Plan line 223) have no row; `ProblemDetailsFilter` logs only unexpected errors. Line 650 puts `LATE_WINDOW_MS` in `clock.service.ts`, while Technical Plan line 255 requires a single definition with a PDR-010 reference that the plan does not name.
* **Rationale & Recommendation**: Define the log shape and location, and name the PDR-010 reference.

### Nullability wording on trainer fields is ambiguous - Severity: Nit
* **ID:** `implementation-readiness-1-24`
* **Reviewer Lens:** `implementation-readiness` (also `codebase-details`, `style`)
* **Affected Scope:** `491`, `503`
* **Discrepancy Description**: "Trainers always get them" conflicts with fields that are optional and nullable; `trainerVenueTimeZone` can be `null` until a venue exists (handled at line 263). Non-trainers get `null`; the nullable form is `type: [string, 'null']`.
* **Rationale & Recommendation**: Say "present for trainers; `trainerVenueTimeZone` is `null` until a venue exists; `null` for non-trainers".

### `tokenFor` needs no change - Severity: Nit
* **ID:** `codebase-details-1-5`
* **Reviewer Lens:** `codebase-details`
* **Affected Scope:** `583`
* **Discrepancy Description**: `tokenFor(url, email)` already works for any seeded email, so "mint tokens for the second trainer" is not a helper change.
* **Rationale & Recommendation**: Reword so the row lists only real edits (the seed data and `test-app.ts` helpers).

### `BookingModule` "imports DatabaseModule" is unnecessary - Severity: Nit
* **ID:** `codebase-details-1-6`
* **Reviewer Lens:** `codebase-details`
* **Affected Scope:** `566`
* **Discrepancy Description**: `DatabaseModule` is `@Global`, and `IdentityModule` does not import it.
* **Rationale & Recommendation**: Drop the import or justify it.

### Contract must stay within the custom validator's keyword subset - Severity: Nit
* **ID:** `codebase-details-1-7`
* **Reviewer Lens:** `codebase-details`
* **Affected Scope:** `611-617`, `490-505`
* **Discrepancy Description**: `apps/api/src/testing/json-schema.ts` throws on unknown keywords such as `minimum`, `pattern` or `minItems`. The plan does not warn about this, and the validator and its spec are not in scope.
* **Rationale & Recommendation**: Note the constraint, or add the validator to scope if constraints are needed (relevant to `implementation-readiness-1-11`).

### Existing ESLint claim, config and hook statements are loosely worded - Severity: Nit
* **ID:** `style-1-3`
* **Reviewer Lens:** `style`
* **Affected Scope:** `591`, `716`, `482`
* **Discrepancy Description**: Line 591 asserts existing ESLint constraints "already allow these dependencies" and says Step 3 "proves it"; both cannot hold. (The codebase reviewer verified the claim is correct against `eslint.config.mjs`, so the fix is wording only. The trainer-web plan lines 49-54 list boundary rules as "to add" and tag `auth` as `type:util`, while this design, line 232, says `data-access`.) Line 482 says red test commits are allowed, while `Architecture.md` section 12 says a hook enforces "green checks"; how a red `test(...)` commit passes is not stated.
* **Rationale & Recommendation**: Write "Expected to need no change. Step 3 lint verifies it." Reconcile the tag in the trainer-web plan. State how a `test` commit passes the hook or drop the claim.

### "`ClockService` is the only reader of `Date.now()`" has no enforcement - Severity: Nit
* **ID:** `style-1-4`
* **Reviewer Lens:** `style`
* **Affected Scope:** `650`
* **Discrepancy Description**: No lint rule or spec enforces this.
* **Rationale & Recommendation**: Name the enforcement, or say "Other code takes `now` from `ClockService`".

### Wording and vague references - Severity: Nit
* **ID:** `style-1-5`
* **Reviewer Lens:** `style`
* **Affected Scope:** `457`, `466`, `472`, `482`, `496`, `529`, `582`, `644`, `651`, `715`, `718`
* **Discrepancy Description**:
  * Line 457 "Each new file below is listed with the project it belongs to" is filler, and not strictly true since tables are grouped by project.
  * Line 466 uses `test(...)` and `feat(...)` as placeholders; give the scope per slice or say "scope = project name".
  * Line 472 "`trainer` on `User`" matches no contract field; say "the three trainer fields on `User`".
  * Line 496 "Pending request card fields" repeats the Technical Plan; point to the contract block.
  * Line 529 "and the like" is vague; list the four codes.
  * Line 582 "End-to-end API cases" collides with `apps/e2e`; say "API integration cases".
  * Line 644 "Per the UI rule" should cite D16 or section 7.1.
  * Line 651 is a garbled sentence ("Pure functions A returning X, and B returning Y, and C."); use a list of three functions.
  * Line 715 "across the same projects" should say "the projects listed above".
  * Line 718 "layout at phone width" and "keyboard focus order" have no pass criterion; name a viewport width and the expected order.
* **Rationale & Recommendation**: Tighten each reference so the plan is checkable without inference.

## Notes for the caller

* Line numbers are as reported by each reviewer against the file at review time. A few reviewer references point into context above line 455 (for example 222-263); they are marked as context where relevant.
* No file other than this report was written. The target file was not edited.
