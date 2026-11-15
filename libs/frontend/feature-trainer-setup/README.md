# feature-trainer-setup

The read-only trainer setup page at `/setup`: the approval status, the admin's note, "Check again" and sign out. Import path: `@fitness-connect/feature-trainer-setup`. Tags: `scope:trainer`, `type:feature`. The template contains only `fc-*` components from `@fitness-connect/ui`. Design: `docs/designs/trainer-home.md`. It shows the status only; profile editing and onboarding are not part of it. It depends on `auth`, `trainer-access` and the shared UI, and may not depend on other feature libs, so it shares nothing with `feature-trainer-home` except `trainer-access`.

## Public API

| Export | Description |
| --- | --- |
| `TrainerSetup` | Selector `fc-trainer-setup`. A placeholder in the skeleton until slice 8. |

## Running unit tests

Run `pnpm nx test feature-trainer-setup` (add `--coverage` for the 80% gate).
