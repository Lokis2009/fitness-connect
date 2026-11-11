import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Salted scrypt password hashes, used only for development credentials.
 *
 * Stored format: `scrypt$<N>$<r>$<p>$<salt>$<hash>`
 *
 * - `N`, `r`, `p`: the scrypt cost parameters in decimal (N is a power of two).
 * - `salt`: 16 random bytes, base64url without padding.
 * - `hash`: the 64 byte scrypt output, base64url without padding.
 *
 * The parameters travel with the hash, so they can be raised later without
 * invalidating hashes that are already stored.
 */
const ALGORITHM = 'scrypt';
const COST = { N: 16384, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function deriveKey(
  password: string,
  salt: Buffer,
  { N, r, p }: { N: number; r: number; p: number },
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, { N, r, p }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, COST, KEY_BYTES);
  return [
    ALGORITHM,
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

/** Constant-time comparison. Returns false for a wrong password or a malformed stored hash. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, n, r, p, encodedSalt, encodedHash] = parts;
  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  const salt = Buffer.from(encodedSalt, 'base64url');
  const expected = Buffer.from(encodedHash, 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await deriveKey(password, salt, cost, expected.length);
  } catch {
    // Non numeric or unsupported cost parameters.
    return false;
  }
  return timingSafeEqual(actual, expected);
}
