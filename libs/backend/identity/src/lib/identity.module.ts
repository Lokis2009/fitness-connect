import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [MeController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class IdentityModule {}
