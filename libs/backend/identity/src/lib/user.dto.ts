import type { components } from '@fitness-connect/api-contract';
import type { UserRow } from '@fitness-connect/database';

/** The `User` schema of the API contract. */
export type UserDto = components['schemas']['User'];

/** Maps a stored user to the contract shape, leaving out internal columns. */
export function toUserDto(user: UserRow): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
