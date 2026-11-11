/**
 * Salted scrypt password hashes, used only for development credentials.
 *
 * Stored format: `scrypt$<N>$<r>$<p>$<salt>$<hash>` where N, r and p are the
 * scrypt cost parameters in decimal and salt and hash are base64url encoded.
 */
export async function hashPassword(password: string): Promise<string> {
  void password;
  throw new Error('not implemented');
}

/** Constant-time comparison. Returns false for a wrong password or a malformed stored hash. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  void password;
  void stored;
  throw new Error('not implemented');
}
