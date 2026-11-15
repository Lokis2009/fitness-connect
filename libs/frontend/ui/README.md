# ui

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test ui` to execute the unit tests.

## Loading, state and layout additions

- `fc-skeleton`: loading placeholder, grey bars in a card-shaped box. Inputs `lines` (default 2) and `actions` (adds two button bars).
- `fc-state`: panel for empty, error and info messages. Inputs `variant` and `title` (not shown for `info`). Projects the body, and an action marked `fcStateAction`.
- `fcScrollIntoView`: directive. When its boolean input becomes true, scrolls the host into view and focuses it.
- `fc-button` input `loadingLabel`: label shown next to the spinner while `loading`.
- `fc-card` inputs `highlighted` (accent border) and `size` (`default` or `full`).
- `fc-page` input `align`: `center` (default) or `top`, one content block of at most the `--container-column` width.
