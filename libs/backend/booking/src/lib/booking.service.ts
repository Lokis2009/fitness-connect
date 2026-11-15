import { Injectable } from '@nestjs/common';
import { UsersService } from '@fitness-connect/identity';
import { TrainersService } from '@fitness-connect/trainers';
import type {
  BookingDto,
  BookingRequestListDto,
  SessionListDto,
} from './booking.dto';
import { BookingsRepository } from './bookings.repository';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly trainers: TrainersService,
    private readonly users: UsersService,
  ) {}

  listPendingRequests(trainerId: string): Promise<BookingRequestListDto> {
    void trainerId;
    void this.bookings;
    void this.trainers;
    void this.users;
    throw new Error('not implemented');
  }

  listSessions(
    trainerId: string,
    from: Date,
    to: Date,
  ): Promise<SessionListDto> {
    void trainerId;
    void from;
    void to;
    throw new Error('not implemented');
  }

  accept(trainerId: string, bookingId: string): Promise<BookingDto> {
    void trainerId;
    void bookingId;
    throw new Error('not implemented');
  }

  decline(trainerId: string, bookingId: string): Promise<BookingDto> {
    void trainerId;
    void bookingId;
    throw new Error('not implemented');
  }
}
