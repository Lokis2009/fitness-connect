import { Module } from '@nestjs/common';
import { TrainersModule } from '@fitness-connect/trainers';
import { MeController } from './me.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [TrainersModule],
  controllers: [MeController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class IdentityModule {}
