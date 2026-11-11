# Fitness Connect

Architecture decisions live in `Architecture.md`. Read it before making structural changes, and update it when a decision changes.

## Workflow (mandatory)

Rules in `.claude/rules/workflow.md` apply to all work: skeleton first, tests first (red and green in separate commits), commit every logical step in Angular-style messages on a branch per workstream. You may commit locally without asking; never push unless asked.

## Frontend UI rule (mandatory)

All UI markup comes from the shared UI library (`libs/frontend/ui`, import path `@fitness-connect/ui`, selector prefix `fc`).

- In `apps/*-web` and in feature or data-access libs, templates may only use components, directives, and pipes exported from the shared UI library.
- Do not write raw HTML elements (`div`, `span`, `button`, `input`, `ul`, `table`, `form`, and so on) in those templates, and do not create Angular components in apps or feature libs just to hold markup.
- If the component you need does not exist in the shared UI library, create it there first (standalone, signals, OnPush, exported from the library's public API), then use it.
- Layout wrappers count too. If you need a stack, grid, or container, add a layout component to the shared library.
- Styling (Tailwind classes, design tokens) lives only inside the shared UI library.
- Colors, spacing, radius and type come only from the design tokens and type scale in `libs/frontend/ui/src/styles/tokens.css`. Rules: `.claude/rules/design-system.md` (loads automatically). Do not add ad-hoc sizes, weights or colors.
- Shared components are built on Angular Material and Angular CDK. Do not add another UI library.
- Enforced by ESLint (`no-restricted-syntax` in the root `eslint.config.mjs`): outside `libs/frontend/ui`, only `fc-*` and `ng-*` element names pass lint. Do not disable or weaken this rule to make lint pass; add the missing shared component instead.

## Frontend coding standards

- Angular coding rules live in `.claude/rules/angular-frontend.md` and load automatically when you touch `apps/*-web/**` or `libs/frontend/**`.
- For any UI work (pages, features, forms, new components), use the `frontend-component` skill. It covers finding or creating the shared component and verifying lint and tests.

## Tooling

- Package manager: pnpm. Run tasks through Nx (`pnpm nx <target> <project>`), not the underlying tools.
- Never guess Nx CLI flags. Check `--help` or the docs first.
