/**
 * A request whose session starts within this window is a late-window request: cancelling it later
 * is flagged (PDR-010).
 */
export const LATE_WINDOW_MS = 3 * 60 * 60 * 1000;
