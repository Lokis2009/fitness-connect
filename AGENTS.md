# Fitness Connect: agent guide

Nx monorepo with pnpm 10.8.1. The frontend is Angular 22.2 (`apps/*-web`, `libs/frontend/**`). The backend is NestJS 11 with Drizzle on Postgres (`apps/api`, `libs/backend/**`). The API contract is OpenAPI in `libs/shared/api-contract`.

Details live in `CLAUDE.md`, which Cursor already applies to every chat. This file adds only what Cursor needs to find on its own.

## Before you start

- Read `Architecture.md` before structural changes, and update it when a decision changes.
- Read `STATUS.md` when you pick up work. It is generated from `status/status.yaml`. Never edit it by hand.
- For new features, follow `.claude/rules/workflow.md`: skeleton first, then a failing test, then the implementation, in separate commits.

## Commands

- Run tasks through Nx: `pnpm nx <target> <project>`.
- Do not guess Nx flags. Check `--help` first.

## Commits

- Angular style: `<type>(<scope>): <subject>`. Types: `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `test`. The scope is the Nx project name or `repo`.
- Work on a branch per workstream. Never commit on `main` unless the user asks for it in that request.
- Never push unless the user asks.
- Stage files by name. Do not use `git add -A`, `--amend`, `--no-verify` or force-push.

## Frontend work (`apps/*-web/**`, `libs/frontend/**`)

- Read `.claude/rules/angular-frontend.md` and `.claude/rules/design-system.md` before editing. Cursor does not load them automatically.
- Use the `frontend-component` skill (`.claude/skills/frontend-component/SKILL.md`) for any UI work.
- Markup comes only from `@fitness-connect/ui` (`fc-*` elements). Do not write raw HTML in apps or feature libs.
