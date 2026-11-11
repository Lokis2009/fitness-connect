/** A single `/` that is not followed by another `/` or a `\` (some browsers treat `\` like `/`). */
const SAFE_PATH = /^\/(?![/\\])/;

/** Whitespace and control characters, which browsers strip from URLs and attackers use to disguise them. */
// eslint-disable-next-line no-control-regex
const DISGUISING_CHARACTERS = /[\u0000- \u007f]/;

/**
 * Returns `candidate` when it is a safe in-app path, otherwise `fallback`.
 * Only paths that start with a single `/` are accepted, which rules out absolute URLs
 * (`https://evil.com`) and protocol-relative ones (`//evil.com`) that would be open redirects.
 */
export function resolveReturnUrl(
  candidate: string | null | undefined,
  fallback: string,
): string {
  return candidate &&
    SAFE_PATH.test(candidate) &&
    !DISGUISING_CHARACTERS.test(candidate)
    ? candidate
    : fallback;
}
