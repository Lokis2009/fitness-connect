import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TrainersService } from './trainers.service';

/**
 * Throws a coded 403 `trainer-not-approved` unless the caller's trainer status
 * is `approved`. Reads `request.user.id`, set by the JWT guard.
 */
@Injectable()
export class TrainerApprovedGuard implements CanActivate {
  constructor(private readonly trainers: TrainersService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    void context;
    void this.trainers;
    throw new Error('not implemented');
  }
}
