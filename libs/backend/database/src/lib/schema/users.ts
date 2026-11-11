import type { Role } from '@fitness-connect/common';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// A literal list, not the ROLES constant of the common lib: drizzle-kit loads
// this file without tsconfig path aliases, so it may only import types from
// workspace libs. The assertions below keep both lists identical.
const USER_ROLES = ['client', 'trainer', 'admin'] as const;
type SameRoles = [Role] extends [(typeof USER_ROLES)[number]]
  ? [(typeof USER_ROLES)[number]] extends [Role]
    ? true
    : never
  : never;
const rolesMatchCommonLib: SameRoles = true;
void rolesMatchCommonLib;

export const userRole = pgEnum('user_role', USER_ROLES);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  cognitoSub: text('cognito_sub').unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Development-only passwords for the dev login. Kept out of `users` so the
 * production schema stays free of credentials.
 */
export const devCredentials = pgTable('dev_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
