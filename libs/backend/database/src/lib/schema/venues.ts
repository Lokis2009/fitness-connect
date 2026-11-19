import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * A trainer's venue. There is no unique constraint on `trainer_user_id`: one
 * venue per trainer is an assumption, so readers use the oldest by `created_at`.
 * `time_zone` is an IANA name.
 */
export const venues = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerUserId: uuid('trainer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    area: text('area').notNull(),
    address: text('address').notNull(),
    instructions: text('instructions'),
    timeZone: text('time_zone').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('venues_trainer_user_id_idx').on(table.trainerUserId)],
);

export type VenueRow = typeof venues.$inferSelect;
export type NewVenueRow = typeof venues.$inferInsert;
