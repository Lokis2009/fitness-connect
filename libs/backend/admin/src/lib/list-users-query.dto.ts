import type { Role } from '@fitness-connect/common';

/** Query of `GET /admin/users`. */
export class ListUsersQuery {
  role?: Role;
  page = 1;
  pageSize = 25;
}
