import { Module } from '@nestjs/common';
import { IdentityModule } from '@fitness-connect/identity';
import { TrainersModule } from '@fitness-connect/trainers';
import { BookingService } from './booking.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { TrainerBookingsController } from './trainer-bookings.controller';

@Module({
  imports: [TrainersModule, IdentityModule],
  controllers: [TrainerBookingsController, BookingsController],
  providers: [BookingService, BookingsRepository],
})
export class BookingModule {}
