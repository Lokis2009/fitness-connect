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
 * Refuses to run when `NODE_ENV` is `production`.
 */
export async function seedDevUsers(db: Database): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to seed development users in production');
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
