import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles, type AuthUser } from '@fitness-connect/common';
import { TrainerApprovedGuard } from '@fitness-connect/trainers';
import type { BookingDto } from './booking.dto';
import { BookingService } from './booking.service';

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
    void caller;
    void id;
    void this.bookings;
    throw new Error('not implemented');
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(
    @CurrentUser() caller: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingDto> {
    void caller;
    void id;
    throw new Error('not implemented');
  }
}
