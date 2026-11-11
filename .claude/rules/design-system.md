---
paths:
  - "apps/*-web/**/*.{ts,html,scss,css}"
  - "libs/frontend/**/*.{ts,html,scss,css}"
---

# Design system: tokens and typography

Source: the Fit-Connect login design (client, trainer, admin). The values live in `libs/frontend/ui/src/styles/tokens.css` (Tailwind `@theme`) and `material-theme.scss` (Material mapping). Change a value there, never in a component. Tailwind classes are used only inside `libs/frontend/ui` (see `CLAUDE.md`).

## Principles

- One layout, three roles. Only the accent color and the copy change per role.
- Flat: no gradients, no emoji, no decorative shadows. Rounded corners, borders and spacing carry the style.
- Accessible: real label, input, button and link elements, touch targets of at least 44 px, text at 4.5:1 contrast.

## Tokens

Tailwind's default palette and type sizes are cleared, so only these exist.

| Group | Token (utility) | Value | Use |
|---|---|---|---|
| Color | `page` | `#F6F7F4` | Page background |
| | `surface` | `#FFFFFF` | Inputs, pills, cards |
| | `ink` | `#14201A` | Primary text |
| | `ink-muted` | `#4A554F` | Secondary text, captions |
| | `line-input` | `#77817B` | Input and pill borders |
| | `line-card` | `#D5DAD6` | Card and tile outlines |
| | `accent` | role accent | Primary button, links, brand panel |
| | `on-accent` | `#FFFFFF` | Text and logo on `accent` |
| | `danger` | `#B3261E` | Errors. Not in the design file, added for form feedback |
| Radius | `rounded-control` | 10 px | Inputs, buttons |
| | `rounded-card` | 16 px | Cards, tiles |
| | `rounded-pill` | 999 px | Role pill |
| Spacing | `p-panel` | 56 px | Brand panel padding, form side top and bottom |
| | `gap-form` | 20 px | Between form fields and blocks |
| | `gap-text` | 16 px | Headline and lead text |
| | `mb-label` / `mt-label` | 6 px | Label to input, hint and error under input |
| | `h-control` | 48 px | Inputs and buttons |
| | `min-h-touch` | 44 px | Checkbox rows, links |

Use `border` (1 px) for inputs, pills and cards.

### Role accent

| Role | Value | White text contrast |
|---|---|---|
| client (default) | `#17694A` | about 6.7:1 |
| trainer | `#2B3FA8` | about 8.8:1 |
| admin | `#262B33` | about 14:1 |

- Each app sets `<html data-role="client|trainer|admin">` in its `index.html`. `accent` and the Material primary color follow it.
- Use `accent` for everything interactive. Neutrals never change per role.
- Never reference `--accent-client`, `--accent-trainer` or `--accent-admin` in a component. Adding a role means adding one accent value and one `data-role` rule in `tokens.css`.
- Do not put the green accent behind small text unless the text is white and at least 14 px.

## Typography rules

1. Two fonts only. **Inter** (400, 500, 600, 700) for all interface text, **Space Grotesk** (500, 700) for the wordmark only (`font-brand`). Never add a third font.
2. Set type with one step class, for example `text-title`. A step sets size, line height and weight together. Do not add `font-*`, `leading-*` or arbitrary sizes next to it.
3. Pick the step by meaning, not by size. Do not use a smaller step just to make text fit.
4. Pair the color with the step as in the table. Do not use `text-ink` on a body paragraph that should be muted.
5. Text on an `accent` background uses `on-accent`. Muted text (`ink-muted`) is never used on `accent`.
6. Headings follow document order: one `h1` per page (`title`), then `heading`, `subheading`. Choose the level for structure, the step for looks, through `fc-heading`.
7. Interface text stays at 13 px or more. Anything below 14 px (only `pill`) must be 600 weight.
8. No uppercase transforms, no letter-spacing tweaks, no italics for emphasis. Use weight.
9. Links are always underlined, never color alone. The PDF shows them underlined, although the design file only underlines on hover; always-on also satisfies WCAG 1.4.1 for links inside sentences.
10. Lowercase wordmark only: `fit`, hyphen bar, `connect`, in Space Grotesk 700, one color (`ink` on light backgrounds, white on accent or dark). `design.md` says green on light, but the design file and the PDF render it in `ink`.

### Type scale

| Step (utility) | Size | Weight | Line height | Color | Use |
|---|---|---|---|---|---|
| `text-display` | 40 px | 700 | 1.15 | `on-accent` | Brand panel headline |
| `text-title` | 32 px | 700 | normal | `ink` | Page title, `h1` |
| `text-heading` | 24 px | 600 | 1.25 | `ink` | `h2`. Not in the design file |
| `text-subheading` | 18 px | 600 | 1.4 | `ink` | `h3`. Not in the design file |
| `text-lead` | 18 px | 400 | 1.5 | `on-accent` | Brand panel supporting text |
| `text-body` | 16 px | 400 | 1.5 | `ink-muted` | Paragraphs, form intro, input text (input text uses `ink`) |
| `text-button` | 16 px | 600 | normal | `on-accent` | Button label |
| `text-label` | 14 px | 500 | normal | `ink` | Form labels |
| `text-caption` | 14 px | 400 | 1.5 | `ink-muted` | Hints, footer text |
| `text-link` | 14 px | 600 | normal | `accent` | Links, always underlined |
| `text-pill` | 13 px | 600 | normal | `ink` | Role pill |

`text-heading` and `text-subheading` are derived from the scale because the design has no `h2` or `h3`. Replace their values once the design defines them.

## Where each rule is applied

- Text, headings, labels and hints: `fc-text` (`body`, `muted`, `small` variants), `fc-heading`, `fc-form-field`. Reuse them instead of styling text yourself.
- Buttons: `fc-button` (48 px, 10 px radius, 16 px / 600) through the Material overrides in `material-theme.scss`.

## Adding or changing a token

1. Edit `tokens.css` (and `material-theme.scss` if Material must follow it).
2. Add a test or update the class assertions of the affected `fc-*` component first.
3. Build all three apps. A token that no utility or Material variable reads is dead; remove it.
4. Update this file and the design section in `Architecture.md` if a rule changes.
