import type { TrainerStatus, User } from '@fitness-connect/data-access';

/**
 * The admin approval status of a trainer: `user.trainerStatus`, or `null` for a signed-out user,
 * a non-trainer or a missing field.
 */
export function trainerStatusOf(
  user: User | null | undefined,
): TrainerStatus | null {
  void user;
  throw new Error('not implemented');
}
