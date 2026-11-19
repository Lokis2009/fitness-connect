import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// A literal list: drizzle-kit loads schema files without tsconfig path aliases.
const TRAINER_STATUSES = [
  'incomplete',
  'submitted',
  'changes_requested',
  'approved',
] as const;

export const trainerStatus = pgEnum('trainer_status', TRAINER_STATUSES);

/**
 * One row per trainer. A missing row reads as `incomplete`. Admin approval and
 * the profile screens write to it.
 */
export const trainerProfiles = pgTable('trainer_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: trainerStatus('status').notNull().default('incomplete'),
  statusNote: text('status_note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TrainerProfileRow = typeof trainerProfiles.$inferSelect;
export type NewTrainerProfileRow = typeof trainerProfiles.$inferInsert;
