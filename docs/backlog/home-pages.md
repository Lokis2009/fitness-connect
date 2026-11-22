# Backlog: client home and admin home

Status: ready to start. The owner has answered the open questions (see Owner decisions). Scope is the signed-in landing page of `client-web` (minimal) and of `admin-web` (list of trainers and users). Trainer-web keeps the shared placeholder `SignedInHome` until its own backlog.

Every item follows `.claude/rules/workflow.md`: skeleton, then a failing test, then implementation, in separate commits on a `<type>/<topic>` branch.

## Starting point

- All three apps route `''` to the same placeholder `SignedInHome` (`libs/frontend/feature-home`): greeting, `GET /me` session check, sign out.
- The API has `GET /me` only. `users` has `id, email, displayName, role, createdAt`. There is no `trainers` table, so a trainer has no verification status yet.
- The shared UI library has `alert, button, card, form, form-field, heading, page, password-input, stack, text, text-input`. It has no app shell, table, badge, select or pagination.
- Backend has role guards (`@Roles`) and an `admin` module is planned in Architecture section 5, but no admin code exists.

## Scope decisions proposed here

| # | Proposal | Why |
|---|---|---|
| S1 | One endpoint `GET /admin/users` with a `role` filter serves "trainers and users". No separate trainers endpoint yet. | Trainers exist only as `users.role = trainer`. A dedicated `/admin/trainers` with verification status belongs to the trainer-profile and approval work (PDR-009). |
| S2 | Admin list is read-only: no create, edit, suspend or delete. | Suspension and similar powers are open (PRD O10). |
| S3 | Client home is a shell, a greeting, account summary and an empty state. No trainer browsing. | Discovery is a separate feature (PRD "Discovery"). |
| S4 | New feature libs `feature-client-home` (`scope:client`) and `feature-admin-home` (`scope:admin`). `feature-home` stays for trainer-web. | The existing lib is `scope:shared` and would otherwise grow role-specific branches. |

## Dependency order

```
HP-1 contract ──┬─> HP-3 API ──┐
                └─> HP-4 client┤
HP-2 UI kit ────────────────────┼─> HP-5 admin page ─> HP-7 e2e
HP-6 client page ───────────────┘
```

HP-1 and HP-2 can start in parallel. HP-3 and HP-6 can start once their predecessor is merged.

## Items

### HP-1 Contract: `GET /admin/users`

Project: `api-contract`. Size: S. Commit type: `feat`.

- Path `GET /admin/users`, `operationId: listUsers`, tag `admin`, query `role` (optional, `Role`), `page` (default 1), `pageSize` (default 25, max 100).
- Schemas: `AdminUser` (`id, email, displayName, role, createdAt`), `UserPage` (`items, total, page, pageSize`).
- Responses: 200, 400 (bad query), 401, 403, 500 using the existing shared responses.
- Regenerate `api.d.ts`; `pnpm nx` contract check passes.

Done when: the spec validates and the generated types export `AdminUser` and `UserPage`.

### HP-2 Shared UI: app shell and list components

Project: `ui`. Size: M. Use the `frontend-component` skill. Each component is standalone, signals, OnPush, exported from the public API, tokens only.

| Component | Purpose |
|---|---|
| `fc-app-shell` | Header with brand name, signed-in user label and a sign-out slot, plus a content area. Usable at phone width. |
| `fc-table` | Typed columns and rows on Material table, with loading, empty and error states. |
| `fc-badge` | Small status label, used for the role. |
| `fc-select` | Single choice control for the role filter, a `FormValueControl` as in Architecture section 13. |
| `fc-pagination` | Previous and next, current page, total, page size. |

Done when: each has a spec (80% gate), axe-clean states, and a lint pass with the `fc-*` only rule.

Open: build `fc-pagination` on Material paginator or write simple previous/next. Default: Material paginator.

### HP-3 API: list users for admins

Projects: `api`, new `libs/backend/admin` (`scope:api`, `type:api-lib`). Depends on HP-1. Size: M.

1. `chore`/`feat` skeleton: module, controller, repository stubs that throw `not implemented`, wired in `app.module.ts`.
2. `test` (red): integration specs in `apps/api`:
   - 401 without a token; 403 for `client` and `trainer`; 200 for `admin`.
   - `role` filter returns only that role; unknown role gives 400.
   - Pagination: `page`, `pageSize`, `total` correct; `pageSize` above 100 gives 400.
   - Stable order: `createdAt` descending, `id` as tiebreaker.
   - Response never includes `cognitoSub` or any credential field.
3. `feat` (green): repository query and DTO mapping, `@Roles('admin')`.

Done when: the integration specs pass and the contract-versus-Nest check (Architecture section 12 follow-up) is not made worse. Flag if that check is still missing, since this is its first admin path.

### HP-4 Data access: `listUsers`

Project: `data-access`. Depends on HP-1. Size: S.

- Add `listUsers({ role?, page?, pageSize? })` to `ApiClient` returning `Observable<UserPage>`; export `AdminUser` and `UserPage` from `api-types.ts`.
- Spec covers URL and query params, and error mapping to `ApiError` (403, 500).

### HP-5 Admin home page

Project: new `libs/frontend/feature-admin-home`, route in `apps/admin-web`. Depends on HP-2, HP-3, HP-4. Size: L.

Skeleton: lib, tags, `AdminHome` stub, route replacing `SignedInHome`.

Acceptance criteria:
1. Inside `fc-app-shell`, shows the heading "Users" and a table with name, email, role badge and created date.
2. A role filter: All, Clients, Trainers, Admins. Changing it reloads from page 1.
3. Pagination shows total and moves between pages.
4. States: loading, empty ("No users match this filter"), error with a retry action. A 403 shows a clear "not allowed" message.
5. Sign out in the shell returns to `/login`.
6. Usable at phone width; table scrolls or stacks without horizontal page scroll.
7. Templates use only `fc-*` components. No raw HTML.

Tests: component specs for each state and the filter and pagination calls, written first and red.

### HP-6 Client home page (minimal)

Project: new `libs/frontend/feature-client-home`, route in `apps/client-web`. Depends on HP-2 (`fc-app-shell` only). Size: S.

Acceptance criteria:
1. Inside `fc-app-shell`, greets the user by display name and shows email.
2. Confirms the session with `GET /me` as today, with loading and failed states.
3. Shows an empty state: "No sessions yet. Trainer search is coming soon." No fake data.
4. Sign out returns to `/login`.
5. Phone-width layout; `fc-*` only.

### HP-7 Seed data and e2e smoke

Projects: `database`, `e2e`. Depends on HP-5 and HP-6. Size: S.

- Extend dev seed with a few extra clients and trainers so the list shows more than one page at a small page size. Seeding stays dev and test only.
- E2E: client signs in and sees the greeting and empty state; admin signs in and sees the seeded users and can filter by role; a client cannot open the admin API path (403).

## Owner decisions

| # | Question | Decision |
|---|---|---|
| Q1 | Does the admin need search by name or email in this slice? | No. Filter by role only. |
| Q2 | Should the list show admins, or only clients and trainers? | Show all three roles; the filter has Clients, Trainers and Admins. |
| Q3 | Should admin reads of user data be audit-logged? | Not in this slice. Revisit with the trainer approval queue. |
| Q4 | Does trainer-web get a matching minimal home now? | No. Trainer-web already has a home, the shared `SignedInHome`, and keeps it. |

## Not in this backlog

Trainer verification status and approval queue (PDR-009), disputed-session view (PDR-011), trainer discovery for clients, any write action on users, Cognito login.
