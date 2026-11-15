import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import {
  CodedHttpException,
  type AuthenticatedRequest,
} from '@fitness-connect/common';
import { TrainersService } from './trainers.service';

/**
 * Throws a coded 403 `trainer-not-approved` unless the caller's trainer status
 * is `approved`. Reads `request.user.id`, set by the JWT guard.
 */
@Injectable()
export class TrainerApprovedGuard implements CanActivate {
  private readonly logger = new Logger(TrainerApprovedGuard.name);

  constructor(private readonly trainers: TrainersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId || !(await this.trainers.isApproved(userId))) {
      // A business rejection: one line at log level, like the 409s of the booking service.
      this.logger.log(
        JSON.stringify({
          event: 'trainer.rejected',
          trainerId: userId ?? null,
          code: 'trainer-not-approved',
        }),
      );
      throw new CodedHttpException(
        403,
        'trainer-not-approved',
        'Your trainer profile has not been approved yet.',
      );
    }
    return true;
  }
}
