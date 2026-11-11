import * as crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './password-hash';

describe('password hashing', () => {
  it('stores scrypt$N$r$p$salt$hash with base64url salt and hash', async () => {
    const stored = await hashPassword('password');

    const parts = stored.split('$');
    expect(parts).toHaveLength(6);
    expect(parts.slice(0, 4)).toEqual(['scrypt', '16384', '8', '1']);
    expect(parts[4]).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(parts[5]).toMatch(/^[A-Za-z0-9_-]{86}$/);
    expect(stored).not.toContain('password');
  });

  it('salts every hash differently', async () => {
    const [first, second] = await Promise.all([
      hashPassword('password'),
      hashPassword('password'),
    ]);

    expect(first).not.toEqual(second);
  });

  it('accepts the right password', async () => {
    const stored = await hashPassword('correct horse');

    await expect(verifyPassword('correct horse', stored)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('correct horse');

    await expect(verifyPassword('wrong horse', stored)).resolves.toBe(false);
    await expect(verifyPassword('', stored)).resolves.toBe(false);
  });

  it('compares in constant time', async () => {
    const stored = await hashPassword('password');
    const spy = jest.spyOn(crypto, 'timingSafeEqual');

    await verifyPassword('password', stored);

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it.each([
    ['an empty string', ''],
    ['plain text', 'password'],
    ['an unknown algorithm', 'bcrypt$16384$8$1$c2FsdA$aGFzaA'],
    ['too few parts', 'scrypt$16384$8$1$c2FsdA'],
    ['too many parts', 'scrypt$16384$8$1$c2FsdA$aGFzaA$extra'],
    ['non numeric parameters', 'scrypt$x$8$1$c2FsdA$aGFzaA'],
    ['an empty salt', 'scrypt$16384$8$1$$aGFzaA'],
    ['an empty hash', 'scrypt$16384$8$1$c2FsdA$'],
    ['parameters scrypt cannot run', 'scrypt$3$8$1$c2FsdA$aGFzaA'],
  ])('returns false for a malformed stored hash: %s', async (_name, stored) => {
    await expect(verifyPassword('password', stored)).resolves.toBe(false);
  });
});
