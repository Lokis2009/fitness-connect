import { Module } from '@nestjs/common';
import { TrainerApprovedGuard } from './trainer-approved.guard';
import { TrainerProfilesRepository } from './trainer-profiles.repository';
import { TrainersService } from './trainers.service';

@Module({
  providers: [TrainersService, TrainerProfilesRepository, TrainerApprovedGuard],
  exports: [TrainersService, TrainerProfilesRepository, TrainerApprovedGuard],
})
export class TrainersModule {}
