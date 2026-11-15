import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles, type AuthUser } from '@fitness-connect/common';
import { TrainerApprovedGuard } from '@fitness-connect/trainers';
import type { BookingDto } from './booking.dto';
import { BookingService } from './booking.service';

/**
 * Accept and decline. A malformed id is not found, like an unknown one: the
 * repository answers 404 before it queries, so ids cannot be probed.
 */
@Controller('bookings')
@Roles('trainer')
@UseGuards(TrainerApprovedGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingService) {}

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @CurrentUser() caller: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingDto> {
    return this.bookings.accept(caller.id, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(
    @CurrentUser() caller: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingDto> {
    return this.bookings.decline(caller.id, id);
  }
}
