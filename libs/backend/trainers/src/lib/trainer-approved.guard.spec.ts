import type { ExecutionContext } from '@nestjs/common';
import { TrainerApprovedGuard } from './trainer-approved.guard';
import type { TrainersService } from './trainers.service';

describe('TrainerApprovedGuard', () => {
  it('is not implemented yet', () => {
    const guard = new TrainerApprovedGuard({} as TrainersService);

    expect(() => guard.canActivate({} as ExecutionContext)).toThrow(
      'not implemented',
    );
  });
});
