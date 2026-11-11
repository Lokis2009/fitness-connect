/**
 * Returns `candidate` when it is a safe in-app path, otherwise `fallback`.
 * Only paths that start with a single `/` are accepted, which rules out absolute URLs
 * (`https://evil.com`) and protocol-relative ones (`//evil.com`) that would be open redirects.
 */
export function resolveReturnUrl(candidate: string | null | undefined, fallback: string): string {
  void candidate;
  void fallback;
  throw new Error('not implemented');
}
