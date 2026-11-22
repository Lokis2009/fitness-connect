# Implementation plan: admin users list (admin home)

Status: draft. Implements HP-1, HP-3, HP-4 and HP-5 of the [home pages backlog](../backlog/home-pages.md), plus the HP-2 rebase and the HP-7 e2e smoke. The minimal client home (HP-6) is separate and can run in parallel.

Rules: `.claude/rules/workflow.md` (skeleton, red `test` commit, green `feat` commit, one logical step per commit, branch per workstream, no push without being asked) and the shared-UI rule in `CLAUDE.md`.

## 1. Goal and scope

An admin signs in to `admin-web` and lands on a page that lists every user, with a role filter (All, Clients, Trainers, Admins) and pagination. Read-only.

Owner decisions that bound the scope (backlog, "Owner decisions"): no search, all three roles shown, no audit log, trainer-web keeps `SignedInHome`. One endpoint, `GET /v1/admin/users`, serves "trainers and users".

## 2. State of play

- `main` has moved since the backlog was written: `booking` and `trainers` backend libs, trainer-home contract paths, `trainer_profiles` with an approval status, and shared UI `badge`, `state`, `skeleton`, `time`, `money`, `deadline`.
- **HP-2** is finished locally on `feat/ui-app-shell-and-lists` (16 commits, not pushed). It was cut from the old `main`, and it builds its own `fc-badge`, which now duplicates `main`'s. It also edits `index.ts` and `material-theme.scss`, which main changed.
- **HP-1** is written but uncommitted in the worktree `.claude/worktrees/agent-a2f1b6c2da676aee2` (`paths/admin-users.yaml`, `schemas/AdminUser.yaml`, `schemas/UserPage.yaml`, `openapi.yaml`, `api.d.ts`). It was cut from the old `main` too. `apps/api/src/app/contract.int.spec.ts` fails with 404 for any contract path the API does not serve, so the contract cannot land without its route.
- `apps/api` tests need Postgres: run `pnpm dev:infra` (Docker) first.

## 3. Pull requests and order

| PR | Branch | Content | Depends on |
|---|---|---|---|
| 1 | `feat/ui-app-shell-and-lists` | HP-2, rebased onto `main` | none |
| 2 | `feat/admin-users-api` | HP-1 + HP-3 (contract and API together) | none |
| 3 | `feat/admin-home` | HP-4 + HP-5 + HP-7 e2e | PR 1 and PR 2 merged |

PR 1 and PR 2 are independent and can be worked in parallel. HP-1 is folded into PR 2 so the contract and its route land together and the conformance test stays green.

## 4. PR 1: rebase HP-2 onto main

1. `git status` first. Rebase `feat/ui-app-shell-and-lists` onto `origin/main`. The branch is local only, so rewriting it is safe.
2. Drop the three `fc-badge` commits (skeleton, test, feat). Keep `main`'s `fc-badge`.
3. Resolve `libs/frontend/ui/src/index.ts` (keep both sets of exports) and `material-theme.scss` (keep both sets of overrides).
4. `fc-table` shows a column as a badge: make it use `main`'s `fc-badge` (a single projected label, no variants). Fix its spec if the markup changed.
5. Run lint, test and build for `ui` and `admin-web`. Check exact `pnpm nx` flags with `--help`.
6. Browser check, which HP-2 skipped: shell at 375 px, table scroll, paginator focus, the select on a phone, and the Space Grotesk wordmark weight. Run axe.

## 5. PR 2: contract and API (HP-1 + HP-3)

New lib `libs/backend/admin` (`@fitness-connect/admin`, tags `scope:api`, `type:api-lib`), added to `tsconfig.base.json` paths. Use the Nx generator that made `trainers` (check `--help`). Architecture section 5 already lists an `admin` module.

Layout:

```
libs/backend/admin/src/lib/
  admin.module.ts              imports IdentityModule
  admin-users.controller.ts    @Controller('admin/users'), @Roles('admin')
  admin-users.service.ts       calls UsersRepository.listPage, maps to the DTO
  list-users-query.dto.ts      class-validator: role, page, pageSize
  admin-user.dto.ts            toAdminUserDto (no cognitoSub)
libs/backend/identity/         UsersRepository.listPage({ role, page, pageSize })
```

`users` belongs to `identity`, so the query goes into its public `UsersRepository` and `admin` stays free of table access. Register `AdminModule` in `apps/api/src/app/app.module.ts`.

Behavior:
- Query: `role` optional, one of `ROLES`; `page` integer at least 1, default 1; `pageSize` integer 1 to 100, default 25. Numbers use `@Type(() => Number)`. The global pipe uses `forbidNonWhitelisted`, so an unknown parameter answers 400.
- Order: `created_at` descending, then `id` descending. Say "descending" in the contract text (the draft says only "then id").
- Count and page are two queries (`count(*)` and `limit/offset`). A tiny inconsistency under concurrent writes is acceptable.
- A page past the last one answers 200 with empty `items` and the real `total`.

Commits:
1. `feat(admin)`: skeleton and contract together. Controller route throws `Error('not implemented')` (a 500, not a 404, so the conformance test stays green). Contract files copied from the worktree, merged with main's `openapi.yaml`, `api.d.ts` regenerated with `pnpm contract:types`, `pnpm contract:lint` clean. Lint and build green.
2. `test(admin)` (red, confirm each fails for the right reason):
   - Unit: query DTO validation table, `toAdminUserDto` omits `cognitoSub`, service mapping, `UsersRepository.listPage` against a test database (filter, order with two users sharing `created_at`, offset, total).
   - `apps/api/src/app/admin-users.int.spec.ts`: 401 without a token; 403 for client and trainer; 200 for admin; role filter; `pageSize=101`, `page=0`, `page=abc`, `role=superuser` and an unknown parameter each give 400; a page past the end; stable order.
   - `contract.int.spec.ts`: strict conformance for 200, 400, 401 and 403 of `GET /admin/users`.
3. `feat(admin)` (green): implement the repository query, service, DTOs and controller. Coverage at least 80% for `admin` and `identity`.

Check before committing: Docker is up, `pnpm nx run-many -t lint test build` for `admin`, `identity`, `api`, `api-contract` consumers and `data-access` (types change).

Risk: seeded users are exactly three, and `me.int.spec.ts` relies on them. Insert extra users inside the admin specs against the throwaway test database; do not change the shared seed here.

## 6. PR 3: data access and the admin page (HP-4, HP-5, HP-7)

Start after PRs 1 and 2 are merged, from the updated `main`.

**Data access (HP-4)**
- `ApiClient.listUsers({ role?, page?, pageSize? })` returns `Observable<UserPage>`. Pass only defined params, the way `getSessions` passes `params`. Export `AdminUser` and `UserPage` from `api-types.ts`.
- Spec: URL, query params, omitted params, and `ApiError` mapping for 400, 403 and 500. Red commit, then green.

**Admin page (HP-5)**
- New lib `libs/frontend/feature-admin-home`, tags `scope:admin`, `type:feature`, exporting `AdminHome` and its route. Mirror `feature-trainer-home` (store plus thin component).
- Skeleton commit: lib, tags, lint paths, `AdminHome` stub, and `apps/admin-web` route `''` (guards `authGuard`, `roleGuard('admin')`) replacing `SignedInHome`. Lint and build pass.
- Store (`users-store.ts`, signals): `role`, `page`, `state` (`loading | ready | error | forbidden`), `items`, `total`. Changing the role resets the page to 1. A stale response from an earlier filter must not overwrite a newer one (switch to the latest request). Retry re-runs the last query.
- Component: `fc-app-shell` with a sign-out `fc-button` in the actions slot, `fc-heading` "Users", `fc-select` role filter (value `''` means All), `fc-table` (name, email, role as `fc-badge`, created date), `fc-pagination`. Forbidden shows an `fc-state` message "You are not allowed to see this list." Created date uses the existing `fc-time` if it fits a date-only value, otherwise a plain date string in the store.
- Red commit first: store spec (initial load, filter resets page, page change, stale response ignored, error then retry, 403) and component spec (rows, empty, loading, error, forbidden, sign out returns to `/login`). Then the green commit.

**E2E (HP-7)**
- `apps/e2e/src/admin-users.e2e.ts`, in the style of `trainer-home.e2e.ts`: admin signs in, sees the three seeded users, filters to Trainers and sees one, and a client token gets 403 from the API path. Do not add seed users unless a pagination scenario needs them; if so, check specs that count seeded users first.

## 7. Finish line

- Each PR: lint, test and build green for affected projects, coverage gate unchanged, `pnpm status:check` passes.
- Status: `status/status.yaml` workstream `home-pages` updates in PR 2 (`next`: PR 3) and again when PR 3 merges (done, with HP-6 noted). Run `pnpm status:generate` and commit both files.
- Manual check of the full flow with `pnpm dev:all`: sign in as `admin@example.com`, filter each role, page through (set a small page size in the dev build or add users), 375 px width, keyboard-only, axe clean.
- Docs: add the endpoint and the `admin` module to `Architecture.md` only if a decision changed; the module is already listed.

## 8. Open items

| # | Item | Default |
|---|---|---|
| P1 | `trainer_profiles.status` now exists. Show a trainer's approval status in the list? | No. It belongs to the approval queue (PDR-009). |
| P2 | Let the admin choose the page size? | No. Fixed at 25, so the table shows no page-size control. |
| P3 | Push and open PR 1 as soon as the rebase is green, without waiting for PR 2? | Yes. |
