import type { components } from '@fitness-connect/api-contract';
import type { UserRow } from '@fitness-connect/database';

/** The `User` schema of the API contract. */
export type UserDto = components['schemas']['User'];

export function toUserDto(user: UserRow): UserDto {
  void user;
  throw new Error('not implemented');
}
