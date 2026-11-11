# Implementation plan: trainer-web

Status: draft. Source decisions live in `Architecture.md`. Items marked **Open** need a product or technical decision before the phase that depends on them.

## 1. Goal

The Angular app trainers use to run their business on the platform: onboard and get verified, manage profile and availability, receive and answer on-demand requests, handle scheduled bookings, run sessions (in person and online), and see earnings and reviews.

Audience: trainers, mostly on phones between sessions, so mobile-first and responsive.

## 2. Starting point

- `libs/frontend/ui` (`@fitness-connect/ui`) has `fc-stack` and `fc-button` only.
- `apps/client-web` is the reference for Tailwind, Material theme and routing setup.
- No backend API, no auth, no data-access or api-contract libs exist yet.
- `eslint.config.mjs` has `depConstraints` set to `*`. Real boundary rules do not exist yet.
- Standing rules: all markup comes from the shared UI library (lint-enforced), and `.claude/rules/angular-frontend.md` applies.

## 3. Decisions that block or shape the work

| # | Question | Blocks | Default if not answered |
|---|----------|--------|-------------------------|
| Q1 | ~~Identity provider~~ Resolved: Amazon Cognito (D7), email and password, hosted login page | none | Develop against a fake `AuthService`; connect the real Cognito user pool for staging |
| Q2 | Payment model and provider (payouts, KYC) | Phase 8 (earnings, payout setup) | Leave earnings read-only, no payout onboarding |
| Q3 | Trainer verification: which documents, manual review only? | Phase 4 | Document upload plus manual admin review |
| Q4 | Does on-demand dispatch cover online sessions too? How are offers ranked? | Phase 7 | In person only, offers shown as received |
| Q5 | Maps and geocoding provider | Phase 5 (service area, venue picker) | Venue entered as text plus coordinates |
| Q6 | Video provider | Phase 7 (online session join) | Join button opens a provider-supplied URL |
| Q7 | API timeline: is the NestJS API available before this app starts? | Phase 2 | Contract first (OpenAPI), mock server until the API exists |

## 4. Architecture of the app

```
apps/trainer-web                 routing, app config, page-level composition only
libs/frontend/ui                 all markup (existing)
libs/frontend/auth               AuthService interface, guards, HTTP interceptor
libs/frontend/data-access        API clients, WebSocket service, signal stores
libs/frontend/feature-trainer-*  one lib per feature area (see Phase 4 onward)
libs/shared/api-contract         DTO types and OpenAPI-generated client types
```

Rules for this app:
- Pages are thin. They compose `fc-*` components and read signal stores. No raw HTML, no Material imports, no Tailwind classes in app or feature templates.
- Feature libs are lazy-loaded through `loadComponent` or `loadChildren`.
- Nx tags: apps `scope:trainer,type:app`; feature libs `scope:trainer,type:feature`; data-access `scope:shared,type:data-access`; auth `scope:shared,type:util`.
- Constraints to add to `eslint.config.mjs` in Phase 1:
  - `type:app` may depend on feature, data-access, ui, util.
  - `type:feature` may depend on data-access, ui, util, but not on other features.
  - `type:ui` may depend on util only.
  - `scope:trainer` may not depend on `scope:client` or `scope:admin`.

## 5. Phases

Each phase ends with `pnpm nx run-many -t lint test build` green for the touched projects.

### Phase 0: decisions and contract
- Answer Q1 to Q7 or accept the defaults.
- Agree the trainer-facing API surface as an OpenAPI draft (profile, availability, bookings, requests, sessions, earnings, reviews). Put the DTO types in `libs/shared/api-contract`.
- Output: OpenAPI file, tag taxonomy, final screen list.

### Phase 1: scaffold and boundaries
- Generate the app with the same options as `client-web`, plus `--port=4201` and tags `scope:trainer,type:app`. Check `--help` before running.
- Copy the styling setup from `client-web` (`.postcssrc.json`, `styles.css`, Material theme in the `styles` array).
- Replace the permissive `depConstraints` with the rules in section 4.
- Generate `libs/frontend/auth`, `libs/frontend/data-access`, `libs/shared/api-contract`.
- Acceptance: app builds and serves, lint fails on a raw `div` in the app, lint fails on a forbidden cross-scope import.

### Phase 2: app shell and shared UI foundation
Create these in `libs/frontend/ui` first (each with a spec), then compose them:
- Layout: `fc-container`, `fc-grid`, `fc-page`, `fc-app-shell` (top bar plus bottom navigation on mobile, side navigation on desktop).
- Content: `fc-heading`, `fc-text`, `fc-card`, `fc-divider`, `fc-avatar`, `fc-badge`, `fc-icon`, `fc-empty-state`, `fc-spinner`.
- Feedback: `fc-snackbar` service wrapper, `fc-dialog` wrapper.
- Navigation: `fc-nav-item`.
- Routing skeleton in the app with placeholder routes for every screen in section 6.
- Data access: HTTP client setup, error mapping, a typed API client generated from or written against the contract. If the API does not exist (Q7), add a mock server (for example MSW) driven by the contract.
- Acceptance: navigating between empty routes works at mobile and desktop widths, AXE clean.

### Phase 3: authentication
- `AuthService` interface in `libs/frontend/auth`: `signIn`, `signOut`, `user` signal, `getAccessToken`. One fake implementation for development (no AWS needed), one real implementation for Cognito using standard OIDC with the hosted login page (`angular-oauth2-oidc`, not Amplify). Roles come from the token's Cognito groups.
- HTTP interceptor attaches the token. Guards: `authGuard`, `trainerRoleGuard`, `onboardingCompleteGuard`.
- Shared UI: `fc-form-field`, `fc-text-input`, `fc-password-input`.
- Screens: a redirect to the Cognito hosted login (sign-in and sign-up happen there), a callback route, sign-out, session expiry handling. The shared UI form-field components below are still needed for onboarding in Phase 4, and for a custom sign-in later if one is required.
- Acceptance: unauthenticated users are redirected, trainer role required, token refresh covered by tests.

### Phase 4: onboarding and verification
- Shared UI: `fc-select`, `fc-multi-select`, `fc-checkbox`, `fc-textarea`, `fc-file-upload`, `fc-stepper`.
- Feature lib `feature-trainer-onboarding`: multi-step form built with Signal Forms (name, bio, specialties, experience, certifications upload, pricing, photo).
- Uploads use pre-signed S3 URLs from the API.
- Verification status screen: pending, approved, rejected with reason, resubmit.
- Acceptance: a new trainer is held on onboarding until the profile is submitted, and sees verification state afterwards. Behaviour for unverified trainers (can they receive bookings?) confirmed under Q3.

### Phase 5: profile, venues and service area
- Feature lib `feature-trainer-profile`: view and edit profile, public preview as clients will see it, pricing per session type (in person, online).
- Venues and service area: where the trainer works (venue entries, travel radius). Uses the `locations` module. Shared UI: `fc-location-picker` (provider-agnostic wrapper, Q5).
- Acceptance: edits persist, preview matches the client-facing profile.

### Phase 6: availability and scheduled bookings
- Shared UI: `fc-week-calendar`, `fc-time-range-input`, `fc-toggle`, `fc-tabs`, `fc-list`.
- Feature lib `feature-trainer-availability`: weekly working hours, time off, exceptions. Times stored in UTC, displayed in the trainer's time zone.
- Feature lib `feature-trainer-bookings`: upcoming, past, and pending bookings; confirm, decline, cancel with reason; booking detail.
- Acceptance: availability changes are reflected in generated slots from the API, and a booking made by a client appears and can be confirmed.

### Phase 7: on-demand requests and sessions
- Data access: WebSocket service (Socket.IO as proposed in `Architecture.md`) with reconnect, exposing signals for connection state, presence and incoming offers.
- Feature lib `feature-trainer-requests`: online/offline toggle, incoming offer card with countdown, accept or decline, handling of expired and already-taken offers.
- Feature lib `feature-trainer-sessions`: session detail, in-person check-in and check-out, online join (Q6), session notes, completion.
- Live location sharing, if used for in-person dispatch, is opt-in and tied to being online. Behaviour defined with the API team (Q4).
- Acceptance: with the API or a mock socket server, an offer appears in real time, accept and decline work, losing connection shows a clear state and recovers.

### Phase 8: earnings and reviews
- Feature lib `feature-trainer-earnings`: totals, per-session breakdown, payout status. Payout setup is only built once Q2 is answered.
- Feature lib `feature-trainer-reviews`: list and detail of reviews, average rating.
- Shared UI: `fc-table` or `fc-data-list`, `fc-rating`, `fc-stat`.
- Acceptance: figures match the API, money formatted from integer minor units plus currency.

### Phase 9: hardening
- Accessibility pass on every screen (AXE, keyboard, contrast).
- Loading, empty and error states on every screen.
- Responsive and PWA behaviour: installable, offline shell, sensible behaviour when offline. Web push is limited on iOS, so notifications also arrive in-app and by email or SMS from the API.
- Performance: lazy routes, bundle budgets in `project.json`, image handling with `NgOptimizedImage`.
- Playwright e2e for the critical flows: onboarding, accept an on-demand request, confirm a booking.

## 6. Screens and routes

| Route | Screen | Phase |
|-------|--------|-------|
| `/sign-in` | Sign in | 3 |
| `/onboarding` | Onboarding steps | 4 |
| `/verification` | Verification status | 4 |
| `/` | Dashboard: today's sessions, requests, quick stats | 7 |
| `/profile` | Profile and preview | 5 |
| `/venues` | Venues and service area | 5 |
| `/availability` | Working hours and time off | 6 |
| `/bookings`, `/bookings/:id` | Bookings list and detail | 6 |
| `/requests` | On-demand requests and online toggle | 7 |
| `/sessions/:id` | Session detail, check-in, join | 7 |
| `/earnings` | Earnings and payouts | 8 |
| `/reviews` | Reviews | 8 |
| `/settings` | Account and notification settings | 9 |

## 7. Testing strategy

- Every new shared component: a spec for inputs, outputs and projection.
- Feature libs: store logic unit tested with signals; page components tested against a mock API client.
- Auth: interceptor, guards and token refresh tested.
- Real-time: WebSocket service tested with a fake socket.
- E2E: Playwright against the mock server first, then against the real API.

## 8. Risks

- **Shared UI growth.** Every screen needs components that do not exist yet. Mitigation: build foundation components in Phase 2 and add the rest at the start of the phase that needs them, never inside the app.
- **API not ready.** Mitigation: contract-first with a mock server, switched by environment config.
- **Real-time complexity.** Offers, expiry and reconnects have many edge cases. Mitigation: isolate in one data-access service with a thorough test suite before building UI on it.
- **Open product rules.** Cancellation policy, no-show handling, verification rules and commission display are undecided and affect Phases 4, 6 and 8.
- **Mobile browsers.** Limited web push on iOS and background location restrictions affect on-demand dispatch. If these prove too limiting, native wrapping (for example Capacitor) is the escape hatch, currently out of scope.
