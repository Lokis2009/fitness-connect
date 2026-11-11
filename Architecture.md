let'# Fitness Connect – Architecture

Source of truth for architecture decisions. Update this file whenever a decision changes.

Status legend: **Decided** = confirmed by the product owner. **Proposed** = recommendation, not yet confirmed. **Open** = needs a decision.

## 1. Product summary

A marketplace connecting fitness trainers with clients ("Uber for fitness trainers").

- Clients find trainers and either **request one on demand** or **book a scheduled slot**.
- Sessions are **in person at a gym/venue** or **online by video**.
- Launch scope: single city/country, one language, small team.

## 2. Decisions

| # | Area | Decision | Status |
|---|------|----------|--------|
| D1 | Monorepo | Nx | Decided |
| D2 | Frontend | Angular | Decided |
| D3 | Backend | NestJS (TypeScript) | Decided |
| D4 | Backend style | Modular monolith | Decided |
| D5 | Database | PostgreSQL + PostGIS | Decided |
| D6 | Cloud | AWS | Decided |
| D7 | Auth | Amazon Cognito, email and password for now, hosted login page acceptable. Chosen for lowest cost and simplest setup; paid usage starts only in production | Decided |
| D8 | Matching | Both on-demand dispatch and scheduled booking | Decided |
| D9 | Session types | In person at gym/venue, online video | Decided |
| D10 | Client apps at launch | Client web, Trainer web, Admin web (all Angular) | Decided |
| D11 | Payments | Provider and model undecided; isolate behind a module boundary | Decided (provider: Open) |
| D12 | Venues | Modelled as a simple location entity, extensible later | Decided (provisional) |
| D13 | Scale/locale | Single city/country, one language | Decided |
| D14 | Package manager / workspace | pnpm, Nx classic (path-alias) setup, no TS project references (`@nx/angular` does not support them) | Decided |
| D15 | Shared UI library | `libs/frontend/ui`, import path `@fitness-connect/ui`, selector prefix `fc`, built on Angular Material + CDK, styled with Tailwind CSS and design tokens | Decided |
| D16 | Raw HTML rule | Apps and feature libs use only `fc-*` components (and `ng-*` structural elements) in templates. Enforced by ESLint (`no-restricted-syntax` in the root `eslint.config.mjs`), switched off only in `libs/frontend/ui` | Decided |

## 3. High-level architecture

```
 Client web (Angular)   Trainer web (Angular)   Admin web (Angular)
          \                    |                    /
           \                   |                   /
            +-------- CloudFront / S3 (static) ----+
                               |
                      Application Load Balancer
                               |
                  +------------+------------+
                  |   NestJS modular monolith |  (REST + WebSocket gateway)
                  |   ECS Fargate, N tasks    |
                  +--+--------+--------+------+
                     |        |        |
              PostgreSQL   Redis    S3 (media)
              + PostGIS  (cache,   
              (RDS)      pub/sub,
                         queues)
                     |
          External: Cognito/Auth0, payment provider,
          video provider, maps/geocoding, push/email/SMS
```

### 3.1 Why a modular monolith

Small team, single market, unclear payment/venue models. One deployable keeps delivery fast and operations simple. Module boundaries are enforced so a module (likely matching/real-time) can be extracted later without a rewrite.

## 4. Monorepo layout (Nx)

```
apps/
  client-web/        Angular – client-facing app
  trainer-web/       Angular – trainer-facing app
  admin-web/         Angular – back office
  api/               NestJS – modular monolith
  api-e2e/ *-e2e/    End-to-end tests
libs/
  shared/
    api-contract/    OpenAPI-generated or hand-written DTO types shared by FE and BE
    util/            Framework-agnostic helpers
  frontend/
    ui/              Shared Angular component library (design system)
    data-access/     API clients, state stores
    auth/            Auth guards, interceptors, token handling
    feature-*/       Feature libs per app domain (search, booking, schedule...)
  backend/
    <domain>/        One lib per backend module (see section 5)
```

Rules:
- Nx module boundary tags enforced via ESLint (`scope:client`, `scope:trainer`, `scope:admin`, `scope:api`, `scope:shared`, and `type:feature|data-access|ui|util`).
- Frontend apps never import backend libs. Shared code goes only through `libs/shared`.
- Cross-module backend calls go through each module's public API (index barrel or events), never through another module's internals or tables.

## 5. Backend modules (NestJS)

| Module | Responsibility |
|--------|----------------|
| `identity` | Users, roles (client, trainer, admin), link to Cognito/Auth0 identities |
| `trainers` | Trainer profiles, specialties, certifications, verification status, pricing |
| `clients` | Client profiles, goals, preferences |
| `locations` | Venues/locations, geocoding, PostGIS queries, service radius |
| `availability` | Trainer working hours, time off, slot generation |
| `booking` | Scheduled bookings, lifecycle (requested, confirmed, completed, cancelled), cancellation rules |
| `dispatch` | On-demand requests: find nearby available trainers, offer, accept/decline, timeouts |
| `sessions` | Session lifecycle for both in-person and online, check-in/out |
| `video` | Video room creation and tokens (provider behind an interface) |
| `payments` | Pricing, charges, refunds, commission, payouts (provider behind an interface) |
| `reviews` | Ratings and reviews after sessions |
| `notifications` | Email, push, SMS, in-app; consumes domain events |
| `realtime` | WebSocket gateway: dispatch offers, status updates, presence |
| `admin` | Verification queue, disputes, moderation, reporting |

Inter-module communication: synchronous calls via public module APIs for queries; in-process domain events (NestJS EventEmitter, or an outbox table later) for side effects such as notifications.

## 6. Key design areas

### 6.1 Two matching flows
- **Scheduled booking**: client browses/searches trainers (PostGIS distance + filters), picks a slot generated by `availability`, creates a booking. Slot reservation must be transactional to avoid double booking (row-level locks or an exclusion constraint on time ranges).
- **On-demand dispatch**: client creates a request, `dispatch` finds eligible nearby trainers who are online, offers the job in rank order with a timeout, first accept wins. Needs trainer presence and (for in-person) live location, delivered over WebSockets with Redis for shared state and pub/sub across API instances.

Both flows end in the same `sessions` entity so downstream logic (payments, reviews, notifications) is shared.

### 6.2 Geospatial
PostGIS `geography` columns with GiST indexes. Nearest-trainer and radius queries run in the database. Geocoding and place search via an external maps provider (**Open**).

### 6.3 Real-time
NestJS WebSocket gateway (Socket.IO proposed) with the Redis adapter so multiple API tasks can broadcast to each other. Status: **Proposed**.

### 6.4 Authentication and authorization
- Managed identity provider issues JWTs; the API validates them and maps them to internal users and roles.
- Role-based access control in NestJS guards. Per-resource ownership checks in services.
- Provider: Amazon Cognito (D7). Roles (client, trainer, admin) are carried as Cognito groups in the JWT.
- Keep it swappable: use standard OIDC in the frontend (not Amplify), hide the provider behind the `AuthService` interface, store users in our own database keyed by the token `sub`, and avoid Cognito-specific custom attributes.
- Development is free and offline: a fake `AuthService` implementation in the frontend and a stub JWT guard in the API. A real Cognito user pool is created only for staging and production. Verify current Cognito pricing and free-tier limits before launch.
- Revisit if phone or social login becomes required, or if a fully custom branded sign-in flow is needed. Those are Cognito's weak spots.

### 6.5 Payments (provider undecided)
All payment logic sits behind a `PaymentProvider` interface in `payments`. Design constraints to keep either path open:
- Store money as integer minor units plus currency code.
- Keep a payment ledger independent of the provider.
- Booking and dispatch call `payments` through its public API only.
Provider and model (marketplace with payouts vs off-platform): **Open**. This affects trainer onboarding and compliance (KYC) and should be settled before building trainer onboarding.

### 6.6 Online video
Provider behind a `VideoProvider` interface in `video`. Candidates: Daily, Twilio Video, LiveKit, Amazon Chime SDK. **Open**.

### 6.7 Venues
Modelled as a `Location` entity (name, address, point, type). Whether partner gyms become first-class actors with their own accounts is **Open** and deferred; the model must not block it.

### 6.8 Data
- PostgreSQL on RDS, PostGIS extension enabled.
- ORM/migrations: **Open**. Prisma has weaker PostGIS support (raw SQL needed); TypeORM or Drizzle or Kysely with raw geospatial queries are alternatives.
- Redis (ElastiCache) for cache, presence, pub/sub, and job queues (BullMQ proposed).
- S3 for profile photos, certification documents. Pre-signed URL uploads.

## 7. Frontend architecture (Angular)

- Latest stable Angular, standalone components, signals, new control flow. **Proposed**.
- Three separate apps, one per audience, to keep bundles, permissions, and release cycles independent. Shared UI and data-access libs avoid duplication.
- State management: signals-based stores per feature; NgRx SignalStore proposed. **Open**.
- API access: typed clients generated from the backend OpenAPI spec (`libs/shared/api-contract`). **Proposed**.
- Real-time: a shared data-access service wraps the WebSocket connection.
- Maps: provider-agnostic wrapper in a shared lib. Provider **Open**.
- Responsive/PWA from the start: no native apps at launch, but client and trainer apps will be used on phones. Push via web push is limited on iOS; revisit if native apps are added.
- SSR for the public trainer search and profile pages (SEO). **Proposed**.

Implementation plans: `docs/plans/trainer-web.md`.

### 7.1 Shared UI library rule

Angular coding standards (signals, standalone defaults, native control flow, Signal Forms, `@Service`, accessibility) are in `.claude/rules/angular-frontend.md`. The `frontend-component` skill in `.claude/skills/` holds the workflow for creating and composing components.

- All markup lives in `libs/frontend/ui`. Templates elsewhere (apps, feature and data-access libs, including inline templates) may contain only `fc-*` components and `ng-*` elements such as `ng-container` and `ng-template`.
- Layout is a shared component too (`fc-stack` exists; add grid, container, and so on there as needed).
- Material and Tailwind are implementation details of the shared library. Apps never import `@angular/material` components directly or use Tailwind classes in their templates.
- A missing component is created in the shared library first, exported from `src/index.ts`, then used.
- Styling setup (see `apps/client-web` as the reference): each app has `.postcssrc.json` with `@tailwindcss/postcss`, a `src/styles.css` that imports `tailwindcss`, `libs/frontend/ui/src/styles/tokens.css` (Tailwind `@theme` design tokens) and a `@source` pointing at the UI library, and lists `libs/frontend/ui/src/styles/material-theme.scss` (Material system tokens via `mat.theme`) in the `styles` array of its `build` target. Tailwind is not combined with Sass; the Material theme is a separate stylesheet.
- Lint exceptions: `router-outlet` is allowed in templates, and `src/index.html` is not linted.
- Known gap: the rule checks element names only. Raw elements created in TypeScript (for example `document.createElement`) are not caught.

## 8. Infrastructure (AWS)

- Static frontends: S3 + CloudFront.
- API: ECS Fargate behind an ALB, containerized with Docker, autoscaling on CPU/requests. WebSocket support via ALB with sticky sessions not required when using the Redis adapter.
- DB: RDS PostgreSQL (Multi-AZ in production). Cache: ElastiCache Redis.
- Secrets: AWS Secrets Manager / SSM Parameter Store.
- IaC: Terraform or AWS CDK. **Open**.
- CI/CD: GitHub Actions with `nx affected` for lint, test, build. **Open** (CI platform not confirmed).
- Environments: local (Docker Compose with Postgres+PostGIS and Redis), staging, production.
- Observability: structured logs to CloudWatch, metrics and tracing via OpenTelemetry. Error tracking (Sentry proposed).

## 9. Cross-cutting concerns

- **Security**: input validation on every endpoint (class-validator), rate limiting, helmet, CORS allow-list, least-privilege IAM, encryption at rest and in transit.
- **Privacy**: location data and health-adjacent data are sensitive. Define retention and consent rules before launch. Applicable regulations depend on the launch country (**Open**).
- **Trust and safety**: trainer verification, reviews, reporting, and admin moderation are part of the product, not an afterthought.
- **Time zones**: store timestamps in UTC; store venue/user time zone for display and slot generation.
- **Testing**: unit tests per lib, API integration tests against a real Postgres+PostGIS container, Playwright e2e for critical flows (booking, dispatch).
- **API versioning**: URL prefix `/v1`; OpenAPI spec generated from NestJS.

## 10. Open questions

Single list of unresolved decisions. When one is answered, move it to section 2 and delete it here. Items marked Resolved stay until the next cleanup.

| # | Question | Blocks | Default if unanswered |
|---|----------|--------|-----------------------|
| 1 | Payment model and provider (marketplace payouts vs off-platform; Stripe Connect or other) | Trainer onboarding, earnings, `payments` module | Payments module behind an interface; earnings read-only; no payout setup |
| 2 | ~~Identity provider~~ | | Resolved: Amazon Cognito (D7) |
| 3 | Video provider (Daily, Twilio, LiveKit, Chime SDK) | Online sessions | Join button opens a provider-supplied URL |
| 4 | Maps and geocoding provider | Service area, venue picker, geo search | Venue as text plus coordinates |
| 5 | ORM: Prisma vs TypeORM vs Drizzle/Kysely (PostGIS needs raw SQL in all of them) | Start of the API | None; decide before the first backend module |
| 6 | IaC tool (Terraform or CDK) and CI platform (GitHub Actions proposed) | First deployment | Local only until needed |
| 7 | Launch country (regulation, currency, payment provider availability, VAT) | Payments, privacy rules | Single currency, no tax handling |
| 8 | Whether venues become first-class partners | `locations` data model | Venue is a simple location entity (D12) |
| 9 | Trainer verification requirements (documents, background checks) | Onboarding, admin queue | Document upload plus manual admin review |
| 10 | Cancellation, no-show, and commission policies | Booking lifecycle, payments | Not enforced |
| 11 | On-demand dispatch: in person only or online too? How are offers ranked (distance, rating, price)? | `dispatch` module, trainer requests screen | In person only; offers shown as received |
| 12 | Native mobile apps (out of scope at launch) | Nothing now | Revisit after launch |
| 13 | API timeline: will the NestJS API exist before trainer-web work starts? | trainer-web data layer | Contract first (OpenAPI) with a mock server |

Related plan: `docs/plans/trainer-web.md` (its Q1 to Q7 map to items 2, 1, 9, 11, 4, 3, 13 above).

## 11. Next steps

1. Resolve the open questions that block scaffolding (ORM, IaC/CI can wait; auth provider and payments should be settled first).
2. Initialize the Nx workspace (convert the current bare TypeScript setup) with `apps/api`, `apps/client-web`, `apps/trainer-web`, `apps/admin-web`.
3. Set up local dev with Docker Compose (Postgres+PostGIS, Redis).
4. Implement the walking skeleton: auth, trainer profile, geo search, one scheduled booking end to end.
5. Add dispatch and real-time after the booking flow works.
