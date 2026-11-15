import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CodedHttpException } from '@fitness-connect/common';
import {
  bookings,
  bookingStatusChanges,
  DATABASE,
  type Database,
} from '@fitness-connect/database';
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'expired'
  | 'withdrawn'
  | 'cancelled'
  | 'completed';

/** A stored booking: the columns this module reads. */
export interface BookingRow {
  id: string;
  trainerUserId: string;
  clientUserId: string;
  venueId: string;
  startsAt: Date;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  status: BookingStatus;
  requestedAt: Date;
  expiresAt: Date;
  decidedAt: Date | null;
}

/** The outcome of `decide`: the updated row, and whether it was a repeat of the same action. */
export interface DecisionResult {
  booking: BookingRow;
  repeat: boolean;
}

/**
 * A 409 that `decide` raises. Carries the booking as it was read under the
 * lock, so the service can log the time left and the start of the session.
 */
export class BookingConflictException extends CodedHttpException {
  constructor(
    code: string,
    message: string,
    readonly booking: BookingRow,
  ) {
    super(409, code, message);
  }
}

type Action = 'accept' | 'decline';
/** The read-or-write handle of the database or of one of its transactions. */
type Executor = Pick<Database, 'select' | 'update' | 'insert' | 'execute'>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MINUTE_MS = 60_000;

const COLUMNS = {
  id: bookings.id,
  trainerUserId: bookings.trainerUserId,
  clientUserId: bookings.clientUserId,
  venueId: bookings.venueId,
  startsAt: bookings.startsAt,
  durationMinutes: bookings.durationMinutes,
  priceMinor: bookings.priceMinor,
  currency: bookings.currency,
  status: bookings.status,
  requestedAt: bookings.requestedAt,
  expiresAt: bookings.expiresAt,
  decidedAt: bookings.decidedAt,
};

const EXPIRED = {
  code: 'booking-expired',
  message: 'The response window for this request has ended.',
};
const WITHDRAWN = {
  code: 'booking-withdrawn',
  message: 'The client withdrew this request.',
};
const NOT_PENDING = {
  code: 'booking-not-pending',
  message: 'This request was already answered.',
};

/** What to do with a booking in `status`. This is the decision table of the design. */
function outcomeOf(
  status: BookingStatus,
  pastDeadline: boolean,
  action: Action,
): 'apply' | 'repeat' | typeof EXPIRED {
  switch (status) {
    case 'pending':
      return pastDeadline ? EXPIRED : 'apply';
    case 'confirmed':
      return action === 'accept' ? 'repeat' : NOT_PENDING;
    case 'declined':
      return action === 'decline' ? 'repeat' : NOT_PENDING;
    case 'expired':
      return EXPIRED;
    case 'withdrawn':
      return WITHDRAWN;
    default:
      return NOT_PENDING;
  }
}

const endOf = (row: BookingRow): number =>
  row.startsAt.getTime() + row.durationMinutes * MINUTE_MS;

@Injectable()
export class BookingsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Pending requests past `now()`, soonest deadline first, with the database time. */
  async pendingForTrainer(
    trainerId: string,
  ): Promise<{ rows: BookingRow[]; serverTime: Date }> {
    // The time is read first and used as the cutoff, so the list and the clock agree.
    const serverTime = await this.serverTime(this.db);
    const rows = await this.db
      .select(COLUMNS)
      .from(bookings)
      .where(
        and(
          eq(bookings.trainerUserId, trainerId),
          eq(bookings.status, 'pending'),
          gt(bookings.expiresAt, serverTime),
        ),
      )
      .orderBy(asc(bookings.expiresAt), asc(bookings.id));
    return { rows, serverTime };
  }

  /** Confirmed bookings overlapping `[from, to)`, soonest first, with the database time. */
  async sessionsForTrainer(
    trainerId: string,
    from: Date,
    to: Date,
  ): Promise<{ rows: BookingRow[]; serverTime: Date }> {
    const serverTime = await this.serverTime(this.db);
    const rows = await this.db
      .select(COLUMNS)
      .from(bookings)
      .where(
        and(
          eq(bookings.trainerUserId, trainerId),
          eq(bookings.status, 'confirmed'),
          lt(bookings.startsAt, to),
          sql`${bookings.startsAt} + ${bookings.durationMinutes} * interval '1 minute' > ${from.toISOString()}::timestamptz`,
        ),
      )
      .orderBy(asc(bookings.startsAt), asc(bookings.id));
    return { rows, serverTime };
  }

  /**
   * Accepts or declines a booking in one transaction at the default isolation
   * level. It locks every pending booking of the client in one statement,
   * ordered by id, so callers lock in the same order and cannot deadlock.
   */
  async decide(
    trainerId: string,
    bookingId: string,
    action: Action,
  ): Promise<DecisionResult> {
    // A malformed id is not found, like an unknown one.
    if (!UUID.test(bookingId)) throw new NotFoundException();

    return this.db.transaction(async (tx) => {
      // 1. The client of the booking, matched on the caller. No lock yet.
      const [target] = await tx
        .select({ clientUserId: bookings.clientUserId })
        .from(bookings)
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.trainerUserId, trainerId),
          ),
        );
      if (!target) throw new NotFoundException();

      // 2. Lock the client's pending bookings, then read the target under the lock.
      const locked = await tx
        .select(COLUMNS)
        .from(bookings)
        .where(
          and(
            eq(bookings.clientUserId, target.clientUserId),
            eq(bookings.status, 'pending'),
          ),
        )
        .orderBy(asc(bookings.id))
        .for('update');
      let current = locked.find((row) => row.id === bookingId);
      if (!current) {
        [current] = await tx
          .select(COLUMNS)
          .from(bookings)
          .where(eq(bookings.id, bookingId))
          .for('update');
      }
      if (!current) throw new NotFoundException();

      // 3. Decide with the time after the lock wait.
      const now = await this.serverTime(tx);
      const outcome = outcomeOf(
        current.status,
        current.expiresAt.getTime() <= now.getTime(),
        action,
      );
      if (outcome === 'repeat') return { booking: current, repeat: true };
      if (outcome !== 'apply') {
        throw new BookingConflictException(
          outcome.code,
          outcome.message,
          current,
        );
      }

      // 4. Write the decision and its history row.
      const next = action === 'accept' ? 'confirmed' : 'declined';
      const [booking] = await tx
        .update(bookings)
        .set({ status: next, decidedAt: now })
        .where(eq(bookings.id, bookingId))
        .returning(COLUMNS);
      await tx.insert(bookingStatusChanges).values({
        bookingId,
        fromStatus: 'pending',
        toStatus: next,
        changedAt: now,
      });

      // 5. Accepting withdraws the client's other open requests for the same time.
      if (action === 'accept') {
        const start = current.startsAt.getTime();
        const end = endOf(current);
        const overlapping = locked.filter(
          (other) =>
            other.id !== bookingId &&
            other.expiresAt.getTime() > now.getTime() &&
            // Half-open ranges: a request that only touches the session stays.
            other.startsAt.getTime() < end &&
            endOf(other) > start,
        );
        if (overlapping.length > 0) {
          const ids = overlapping.map((other) => other.id);
          await tx
            .update(bookings)
            .set({ status: 'withdrawn' })
            .where(inArray(bookings.id, ids));
          await tx.insert(bookingStatusChanges).values(
            ids.map((id) => ({
              bookingId: id,
              fromStatus: 'pending' as const,
              toStatus: 'withdrawn' as const,
              changedAt: now,
            })),
          );
        }
      }

      return { booking, repeat: false };
    });
  }

  /** The database's `clock_timestamp()`, which keeps moving inside a transaction. */
  private async serverTime(executor: Executor): Promise<Date> {
    const result = await executor.execute<{ now: number }>(
      sql`select (extract(epoch from clock_timestamp()) * 1000)::float8 as now`,
    );
    return new Date(Math.floor(Number(result.rows[0].now)));
  }
}
