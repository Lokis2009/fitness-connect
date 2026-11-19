import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles, type AuthUser } from '@fitness-connect/common';
import { TrainerApprovedGuard } from '@fitness-connect/trainers';
import type { BookingRequestListDto, SessionListDto } from './booking.dto';
import { BookingService } from './booking.service';
// Value import on purpose: the validation pipe reads the class from decorator metadata.
import { SessionsQueryDto } from './sessions-query.dto';

@Controller('trainers/me')
@Roles('trainer')
@UseGuards(TrainerApprovedGuard)
export class TrainerBookingsController {
  constructor(private readonly bookings: BookingService) {}

  @Get('booking-requests')
  bookingRequests(
    @CurrentUser() caller: AuthUser,
  ): Promise<BookingRequestListDto> {
    return this.bookings.listPendingRequests(caller.id);
  }

  @Get('sessions')
  sessions(
    @CurrentUser() caller: AuthUser,
    @Query() query: SessionsQueryDto,
  ): Promise<SessionListDto> {
    return this.bookings.listSessions(
      caller.id,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
