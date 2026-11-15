import { sql } from 'drizzle-orm';
import {
  char,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { venues } from './venues';

// A literal list: drizzle-kit loads schema files without tsconfig path aliases.
const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'declined',
  'expired',
  'withdrawn',
  'cancelled',
  'completed',
] as const;

export const bookingStatus = pgEnum('booking_status', BOOKING_STATUSES);

/**
 * A session request and, once accepted, the confirmed session. Created by the
 * client request flow, which also adds the no-overlap constraint.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerUserId: uuid('trainer_user_id')
      .notNull()
      .references(() => users.id),
    clientUserId: uuid('client_user_id')
      .notNull()
      .references(() => users.id),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    status: bookingStatus('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'bookings_duration_minutes_positive',
      sql`${table.durationMinutes} > 0`,
    ),
    check('bookings_price_minor_non_negative', sql`${table.priceMinor} >= 0`),
    check(
      'bookings_expires_after_requested',
      sql`${table.expiresAt} > ${table.requestedAt}`,
    ),
    index('bookings_trainer_status_expires_idx').on(
      table.trainerUserId,
      table.status,
      table.expiresAt,
    ),
    index('bookings_trainer_status_starts_idx').on(
      table.trainerUserId,
      table.status,
      table.startsAt,
    ),
    index('bookings_client_status_idx').on(table.clientUserId, table.status),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
