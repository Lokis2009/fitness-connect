---
name: frontend-component
description: Use whenever you build or change anything in the Angular frontend (apps/*-web, libs/frontend/**): a page, a feature, a form, or any UI. Finds the right component in the shared UI library or creates the missing one there first, then composes it. Triggers on "add a component", "build a page/screen/form", "create UI for ...".
---

# Frontend component workflow

All markup comes from `libs/frontend/ui` (`@fitness-connect/ui`, prefix `fc`). Apps and feature libs compose `fc-*` components and never write raw HTML. The Angular coding rules in `.claude/rules/angular-frontend.md` apply to every file you touch.

## Steps

1. **Look for an existing component.** Read `libs/frontend/ui/src/index.ts` and the folders under `libs/frontend/ui/src/lib/`. Reuse and compose what exists.
2. **If it is missing, create it in the shared library first.** Do not create it in an app or feature lib, even temporarily.
   - Generate with Nx, after checking `pnpm nx g @nx/angular:component --help`:
     `pnpm nx g @nx/angular:component --name=<name> --path=libs/frontend/ui/src/lib/<name>/<name> --prefix=fc --style=scss --inlineTemplate --export`
     Add `--dry-run` first if unsure about paths. Drop `--inlineTemplate` for large templates.
   - Selector `fc-<name>`. Do not set `standalone: true` or `changeDetection` (both are defaults).
   - Inputs via `input()`, outputs via `output()`, two-way via `model()`, host bindings via the `host` object.
   - Wrap Angular Material or CDK for behaviour (buttons, dialogs, overlays, form fields). Apps never import Material directly.
   - Style with Tailwind classes and design tokens inside the component only. Class names must appear as literals in source so Tailwind can see them (use a lookup map, not string concatenation of partial names).
   - Accessibility: semantic elements, labels, keyboard support, visible focus, contrast. It must pass AXE.
   - Export it from `libs/frontend/ui/src/index.ts`.
   - Write a spec next to it covering inputs, outputs, and content projection.
3. **Compose it in the app or feature.** Templates there contain only `fc-*` and `ng-*` elements. Layout also goes through shared components (`fc-stack`, and others you add).
4. **Verify.**
   - `pnpm nx run-many -t lint test --projects=ui,<touched projects>`
   - Lint failing with "Raw HTML and non-shared components are not allowed here" means a shared component is missing. Add it to the shared library. Never disable or loosen the rule.

## Forms

New forms use Signal Forms (`@angular/forms/signals`). Field controls (text input, select, checkbox, ...) are shared `fc-*` components that integrate with those forms; create them in the shared library when missing.

## Do not

- Add `div`, `span`, `button`, `input`, and so on to app or feature templates, including inline templates.
- Add another UI library.
- Use `*ngIf`/`*ngFor`, `ngClass`/`ngStyle`, `CommonModule`, `@Input`/`@Output`, `@HostBinding`/`@HostListener`, or constructor injection.
