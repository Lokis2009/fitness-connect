import type { components } from '@fitness-connect/api-contract';
import type { UserRow } from '@fitness-connect/database';
import type { TrainerUserFields } from '@fitness-connect/trainers';

/** The `User` schema of the API contract. */
export type UserDto = components['schemas']['User'];

/**
 * Maps a stored user to the contract shape, leaving out internal columns.
 * `trainerFields` carries the three trainer fields (all null for non-trainers).
 */
export function toUserDto(
  user: UserRow,
  trainerFields?: TrainerUserFields,
): UserDto {
  void trainerFields;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
