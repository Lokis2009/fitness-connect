---
paths:
  - "apps/*-web/**/*.{ts,html,scss,css}"
  - "libs/frontend/**/*.{ts,html,scss,css}"
---

# Angular frontend rules

Applies to the Angular apps and `libs/frontend/**`. Angular v22+ (installed: 22.2). Source: Angular best-practices and angular-20.mdc guidelines, adapted to this repo.

Write functional, maintainable, performant, and accessible code. Markup placement is governed by the shared UI rule in `CLAUDE.md`: all HTML lives in `libs/frontend/ui`.

## TypeScript

- Strict typing. Prefer inference when the type is obvious (`let name = 'Angular'`, not `let name: string = 'Angular'`).
- No `any`. Use `unknown` when the type is uncertain and narrow it.

## Angular

- Standalone only. No NgModules.
- Do NOT write `standalone: true` in `@Component`, `@Directive`, or `@Pipe`. It is the default.
- Do NOT write `changeDetection: ChangeDetectionStrategy.OnPush`. It is the default in v22+.
- Use signals for state.
- Lazy-load feature routes.
- Do NOT use `@HostBinding` or `@HostListener`. Use the `host` object in the decorator.
- Use `NgOptimizedImage` for static images (it does not work for inline base64 images).

## Accessibility

- Must pass all AXE checks.
- Must meet WCAG AA minimums: focus management, color contrast, ARIA attributes.

## Components

- Small, single responsibility.
- Use `input()`, `output()`, and `model()` (for `[(prop)]` two-way binding), not the `@Input`/`@Output` decorators and not an `input()`/`output()` pair for two-way binding.
- Use `computed()` for derived state and `linkedSignal()` for state derived from several reactive sources that must stay in sync.
- Prefer inline templates for small components. External templates and styles use paths relative to the component file.
- New forms use Signal Forms (`@angular/forms/signals`). If not, use Reactive forms, never template-driven.
- No `ngClass`: use `[class.active]="isActive"`, `[class]="{...}"`, or `[class]="classes"`.
- No `ngStyle`: use `[style.font-size.px]="size"` or `[style]="styles"`.
- Do not import `CommonModule`. Import only the directives and pipes the template uses (`AsyncPipe`, `DatePipe`, ...).

## State

- Signals for local state, `computed()` for anything derivable.
- Keep transformations pure and predictable.
- Never `mutate` a signal. Use `set` or `update`.

## Templates

- Keep them simple. Move logic into the component class.
- Native control flow only: `@if`, `@for` (always with `track`), `@switch`. No `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use the `async` pipe for observables.
- Do not assume globals such as `new Date()` are available in templates.

## Services

- Single responsibility.
- Prefer `@Service` over `@Injectable({ providedIn: 'root' })` for new singleton services.
- Use `inject()`, not constructor injection.
