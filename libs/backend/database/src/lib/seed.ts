import { hashPassword, type Role } from '@fitness-connect/common';
import type { Database } from './client';
import { devCredentials, users } from './schema';

/** Password of every seeded account. Development only. */
export const DEV_PASSWORD = 'password';

export interface SeedUser {
  email: string;
  displayName: string;
  role: Role;
}

export const SEED_USERS: readonly SeedUser[] = [
  { email: 'client@example.com', displayName: 'Casey Client', role: 'client' },
  {
    email: 'trainer@example.com',
    displayName: 'Taylor Trainer',
    role: 'trainer',
  },
  { email: 'admin@example.com', displayName: 'Alex Admin', role: 'admin' },
];

/**
 * Inserts one user per role with the dev password. Idempotent: users are
 * matched by email and keep their id, and an existing password hash is kept.
 * Runs only when `NODE_ENV` is explicitly `development` or `test`, so an unset
 * or unexpected value never seeds the well-known password into a real database.
 */
export async function seedDevUsers(db: Database): Promise<void> {
  const nodeEnv = process.env['NODE_ENV'];
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    throw new Error(
      `Refusing to seed development users: NODE_ENV must be "development" or "test" (got "${nodeEnv ?? ''}")`,
    );
  }

  await db.transaction(async (tx) => {
    for (const seed of SEED_USERS) {
      const [user] = await tx
        .insert(users)
        .values(seed)
        .onConflictDoUpdate({
          target: users.email,
          set: { displayName: seed.displayName, role: seed.role },
        })
        .returning({ id: users.id });

      await tx
        .insert(devCredentials)
        .values({
          userId: user.id,
          passwordHash: await hashPassword(DEV_PASSWORD),
        })
        .onConflictDoNothing();
    }
  });
}
