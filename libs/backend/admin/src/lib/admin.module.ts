import { Module } from '@nestjs/common';
import { IdentityModule } from '@fitness-connect/identity';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [IdentityModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}
