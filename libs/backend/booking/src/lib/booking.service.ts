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
} from './booking.dto';
import {
  BookingConflictException,
  BookingsRepository,
  type BookingRow,
} from './bookings.repository';

type Action = 'accept' | 'decline';

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
    const { clientName, venueOf } = await this.lookups(rows);

    return {
      serverTime: serverTime.toISOString(),
      items: rows.map((row) =>
        toBookingRequestDto(row, clientName(row), venueOf(row)),
      ),
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
    const { clientName, venueOf } = await this.lookups(rows);

    return {
      serverTime: serverTime.toISOString(),
      items: rows.map((row) =>
        toSessionDto(row, clientName(row), venueOf(row)),
      ),
    };
  }

  accept(trainerId: string, bookingId: string): Promise<BookingDto> {
    return this.decide(trainerId, bookingId, 'accept');
  }

  decline(trainerId: string, bookingId: string): Promise<BookingDto> {
    return this.decide(trainerId, bookingId, 'decline');
  }

  /** Client names and venues of the rows, one batched call to each owner module. */
  private async lookups(rows: BookingRow[]) {
    const [names, venues] = await Promise.all([
      this.users.displayNames([...new Set(rows.map((r) => r.clientUserId))]),
      this.trainers.venuesByIds([...new Set(rows.map((r) => r.venueId))]),
    ]);
    return {
      clientName: (row: BookingRow): string => {
        const name = names.get(row.clientUserId);
        if (name === undefined) {
          throw new Error(`The client of booking ${row.id} was not found`);
        }
        return name;
      },
      venueOf: (row: BookingRow) => {
        const venue = venues.get(row.venueId);
        if (venue === undefined) {
          throw new Error(`The venue of booking ${row.id} was not found`);
        }
        return venue;
      },
    };
  }

  private async decide(
    trainerId: string,
    bookingId: string,
    action: Action,
  ): Promise<BookingDto> {
    try {
      const { booking, repeat } = await this.bookings.decide(
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
        );
      } else if (error instanceof NotFoundException) {
        this.logDecision(trainerId, bookingId, action, 'not-found', null);
      }
      throw error;
    }
  }

  /** One JSON line per decision, accepted or rejected for a business reason. */
  private logDecision(
    trainerId: string,
    bookingId: string,
    action: Action,
    result: string,
    booking: BookingRow | null,
  ): void {
    const now = Date.now();
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
