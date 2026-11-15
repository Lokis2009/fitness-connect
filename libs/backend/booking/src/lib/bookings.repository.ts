import { Injectable } from '@nestjs/common';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'expired'
  | 'withdrawn'
  | 'cancelled'
  | 'completed';

/** A stored booking. The columns come with the database schema. */
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

@Injectable()
export class BookingsRepository {
  /** Pending requests past `now()`, soonest deadline first, with the database time. */
  pendingForTrainer(
    trainerId: string,
  ): Promise<{ rows: BookingRow[]; serverTime: Date }> {
    void trainerId;
    throw new Error('not implemented');
  }

  /** Confirmed bookings overlapping `[from, to)`, soonest first, with the database time. */
  sessionsForTrainer(
    trainerId: string,
    from: Date,
    to: Date,
  ): Promise<{ rows: BookingRow[]; serverTime: Date }> {
    void trainerId;
    void from;
    void to;
    throw new Error('not implemented');
  }

  /** Accepts or declines a booking in one transaction. Owns the transaction. */
  decide(
    trainerId: string,
    bookingId: string,
    action: 'accept' | 'decline',
  ): Promise<DecisionResult> {
    void trainerId;
    void bookingId;
    void action;
    throw new Error('not implemented');
  }
}
