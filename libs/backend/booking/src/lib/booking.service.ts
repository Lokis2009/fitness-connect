import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersService } from '@fitness-connect/identity';
import { TrainersService } from '@fitness-connect/trainers';
import {
  toBookingDto,
  toBookingRequestDto,
  toSessionDto,
  type BookingDto,
  type BookingRequestListDto,
  type SessionListDto,
  type VenueSummaryDto,
} from './booking.dto';
import {
  BookingConflictException,
  BookingsRepository,
  type BookingAction,
  type BookingRow,
} from './bookings.repository';

@Injectable()
export class BookingService {
  private readonly logger = new Logger('BookingService');

  constructor(
    private readonly bookings: BookingsRepository,
    private readonly trainers: TrainersService,
    private readonly users: UsersService,
  ) {}

  async listPendingRequests(trainerId: string): Promise<BookingRequestListDto> {
    const { rows, serverTime } =
      await this.bookings.pendingForTrainer(trainerId);

    return {
      serverTime: serverTime.toISOString(),
      items: await this.present(rows, toBookingRequestDto),
    };
  }

  async listSessions(
    trainerId: string,
    from: Date,
    to: Date,
  ): Promise<SessionListDto> {
    const { rows, serverTime } = await this.bookings.sessionsForTrainer(
      trainerId,
      from,
      to,
    );

    return {
      serverTime: serverTime.toISOString(),
      items: await this.present(rows, toSessionDto),
    };
  }

  accept(trainerId: string, bookingId: string): Promise<BookingDto> {
    return this.decide(trainerId, bookingId, 'accept');
  }

  decline(trainerId: string, bookingId: string): Promise<BookingDto> {
    return this.decide(trainerId, bookingId, 'decline');
  }

  /**
   * Builds a list item for each row with its client name and venue, from one batched call to each
   * owner module. A row the lookups miss must not fail the whole list, because the trainer would
   * see nothing on every poll: a missing client name shows as "Unknown client", so the request
   * can still be answered, and a row without a venue is left out. Both are logged as errors.
   */
  private async present<T>(
    rows: BookingRow[],
    build: (row: BookingRow, clientName: string, venue: VenueSummaryDto) => T,
  ): Promise<T[]> {
    const [names, venues] = await Promise.all([
      this.users.displayNames([...new Set(rows.map((r) => r.clientUserId))]),
      this.trainers.venuesByIds([...new Set(rows.map((r) => r.venueId))]),
    ]);
    const items: T[] = [];
    for (const row of rows) {
      const venue = venues.get(row.venueId);
      if (venue === undefined) {
        this.logger.error(
          `Booking ${row.id} is left out of the list: its venue ${row.venueId} was not found`,
        );
        continue;
      }
      let clientName = names.get(row.clientUserId);
      if (clientName === undefined) {
        this.logger.error(
          `Booking ${row.id} shows "Unknown client": client ${row.clientUserId} was not found`,
        );
        clientName = 'Unknown client';
      }
      items.push(build(row, clientName, venue));
    }
    return items;
  }

  private async decide(
    trainerId: string,
    bookingId: string,
    action: BookingAction,
  ): Promise<BookingDto> {
    try {
      const { booking, repeat, serverTime } = await this.bookings.decide(
        trainerId,
        bookingId,
        action,
      );
      this.logDecision(
        trainerId,
        bookingId,
        action,
        repeat ? 'repeat' : 'ok',
        booking,
        serverTime,
      );
      return toBookingDto(booking);
    } catch (error) {
      if (error instanceof BookingConflictException) {
        this.logDecision(
          trainerId,
          bookingId,
          action,
          error.code,
          error.booking,
          error.serverTime,
        );
      } else if (error instanceof NotFoundException) {
        this.logDecision(trainerId, bookingId, action, 'not-found', null, null);
      }
      throw error;
    }
  }

  /** One JSON line per decision, accepted or rejected for a business reason. */
  private logDecision(
    trainerId: string,
    bookingId: string,
    action: BookingAction,
    result: string,
    booking: BookingRow | null,
    serverTime: Date | null,
  ): void {
    // The database time the decision was made at, not the device clock of the API host.
    const now = serverTime?.getTime() ?? Date.now();
    this.logger.log(
      JSON.stringify({
        event: 'booking.decided',
        bookingId,
        trainerId,
        action,
        result,
        secondsToDeadline: booking
          ? Math.round((booking.expiresAt.getTime() - now) / 1000)
          : null,
        minutesToStart: booking
          ? Math.round((booking.startsAt.getTime() - now) / 60_000)
          : null,
      }),
    );
  }
}
