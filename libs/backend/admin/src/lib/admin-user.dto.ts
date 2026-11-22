import type { components } from '@fitness-connect/api-contract';
import type { UserRow } from '@fitness-connect/database';

/** The `AdminUser` schema of the API contract. */
export type AdminUserDto = components['schemas']['AdminUser'];

/** The `UserPage` schema of the API contract. */
export type UserPageDto = components['schemas']['UserPage'];

/** Maps a stored user to the contract shape, leaving out internal columns. */
export function toAdminUserDto(user: UserRow): AdminUserDto {
  void user;
  throw new Error('not implemented');
}
