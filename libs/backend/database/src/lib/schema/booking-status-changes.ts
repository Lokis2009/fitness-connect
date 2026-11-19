import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings, bookingStatus } from './bookings';

/**
 * The status history of a booking. It stores no actor and no reason.
 * `from_status` is null when the booking is created.
 */
export const bookingStatusChanges = pgTable(
  'booking_status_changes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    fromStatus: bookingStatus('from_status'),
    toStatus: bookingStatus('to_status').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('booking_status_changes_booking_id_idx').on(table.bookingId),
  ],
);

export type BookingStatusChangeRow = typeof bookingStatusChanges.$inferSelect;
export type NewBookingStatusChangeRow =
  typeof bookingStatusChanges.$inferInsert;
