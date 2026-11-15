import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CodedHttpException, isUuid } from '@fitness-connect/common';
import {
  bookings,
  bookingStatus,
  bookingStatusChanges,
  DATABASE,
  type Database,
} from '@fitness-connect/database';
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm';

/** The status of a booking, taken from the database enum so the two cannot differ. */
export type BookingStatus = (typeof bookingStatus.enumValues)[number];

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

/**
 * The outcome of `decide`: the updated row, whether it was a repeat of the same action, and the
 * database time the decision was made at.
 */
export interface DecisionResult {
  booking: BookingRow;
  repeat: boolean;
  serverTime: Date;
}

/**
 * A 409 that `decide` raises. Carries the booking as it was read under the
 * lock and the database time of the decision, so the service can log the time
 * left and the start of the session.
 */
export class BookingConflictException extends CodedHttpException {
  constructor(
    code: string,
    message: string,
    readonly booking: BookingRow,
    readonly serverTime: Date,
  ) {
    super(409, code, message);
  }
}

/** What the trainer decides on a pending request. */
export type BookingAction = 'accept' | 'decline';
/** The read-or-write handle of the database or of one of its transactions. */
type Executor = Pick<Database, 'select' | 'update' | 'insert' | 'execute'>;

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
const STARTED = {
  code: 'booking-expired',
  message: 'The session has already started.',
};
const NOT_PENDING = {
  code: 'booking-not-pending',
  message: 'This request was already answered.',
};

type Conflict = { code: string; message: string };

/**
 * What to do with a booking in `status`. This is the decision table of the design, plus one rule:
 * a pending request whose session has started cannot be accepted, even inside its response window.
 * It can still be declined, to clear a stale request.
 */
function outcomeOf(
  status: BookingStatus,
  pastDeadline: boolean,
  started: boolean,
  action: BookingAction,
): 'apply' | 'repeat' | Conflict {
  switch (status) {
    case 'pending':
      if (pastDeadline) return EXPIRED;
      return started && action === 'accept' ? STARTED : 'apply';
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
    action: BookingAction,
  ): Promise<DecisionResult> {
    // A malformed id is not found, like an unknown one.
    if (!isUuid(bookingId)) throw new NotFoundException();

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
        current.startsAt.getTime() <= now.getTime(),
        action,
      );
      if (outcome === 'repeat') {
        return { booking: current, repeat: true, serverTime: now };
      }
      if (outcome !== 'apply') {
        throw new BookingConflictException(
          outcome.code,
          outcome.message,
          current,
          now,
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

      return { booking, repeat: false, serverTime: now };
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
