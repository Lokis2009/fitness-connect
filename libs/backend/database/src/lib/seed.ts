import type { Role } from '@fitness-connect/common';
import type { Database } from './client';

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
 * Inserts one user per role with the dev password. Idempotent. Refuses to run
 * when `NODE_ENV` is `production`.
 */
export async function seedDevUsers(db: Database): Promise<void> {
  void db;
  throw new Error('not implemented');
}
