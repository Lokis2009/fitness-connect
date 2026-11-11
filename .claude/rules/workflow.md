# Agent workflow rules

Apply to every task in this repo. Order of work for anything new: **skeleton, then failing test, then implementation**, committed in small steps.

## do-skeleton-first

- For a new app, lib, module, endpoint or feature, first create the structure and wiring: folders, Nx tags, routes, DI, interfaces, contract entries, and stubbed implementations.
- Stubs throw `Error('not implemented')` (or the equivalent). They never return fake data.
- The skeleton must compile and pass lint and build before any real logic is written, and is committed on its own. Other workstreams build on it.
- Generator output counts as skeleton. Check a generator's `--help` before using it.

## do-tests-first

- After the skeleton, write the test, run it, and confirm it fails for the right reason (not a typo or a missing import) before writing implementation.
- Bug fixes start with a test that reproduces the bug.
- Test and implementation go in **separate commits**: a `test` commit (red), then a `feat` or `fix` commit (green).
- Exceptions (no test needed first): generator output, config files, styling-only changes, docs, throwaway spikes (a spike is never merged as is).
- Coverage gate: 80% lines, functions, branches and statements per project, configured in each project's `vite.config.mts`. Do not lower a threshold to make a commit pass; add the missing tests.

## do-commit-every-logical-step

- You may commit locally without asking. **Never push without being asked.**
- One logical step per commit, for example: "add skeleton", "add failing spec for `fc-form-field`", "implement `fc-form-field`".
- Message format, Angular style: `<type>(<scope>): <subject>`
  - Types: `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `test`.
  - Scope: the Nx project name (`ui`, `client-web`, `trainer-web`, `api`, `api-contract`, ...) or `repo` for root tooling and docs.
  - Subject: imperative, lowercase first letter, no trailing period, header at most 100 characters.
  - Optional body explains why. End with the attribution trailer given in the session context.
- Work on a branch per workstream, named `<type>/<short-topic>` (for example `feat/shared-ui-login`), merged by pull request. Do not commit to `main` directly.
- A `test` commit may leave tests red. Every other commit type that touches code must leave lint and tests green for the affected projects.
- Stage files by name, never `git add -A`. Do not amend, force-push or skip hooks (`--no-verify`). Check what is staged for secrets before committing.
- Pass the message with `-m` or a heredoc so the commit guard can read it.

## Enforcement

- `.claude/hooks/commit-guard.mjs`, run by a `PreToolUse` hook on Bash (configured in `.claude/settings.json`), blocks a `git commit` when the header is not in the format above, when lint fails for affected projects, or (except for `test`, `docs`, `ci` commits) when tests or coverage fail.
- If the hook blocks a commit, fix the cause. Do not work around it.
