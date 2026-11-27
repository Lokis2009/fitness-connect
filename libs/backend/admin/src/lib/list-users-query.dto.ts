import { ROLES, type Role } from '@fitness-connect/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Keeps the offset (`(page - 1) * pageSize`, at most 1e8) far inside the Postgres bigint range. */
export const MAX_PAGE = 1_000_000;

/** Query of `GET /admin/users`. Query strings arrive as text, so the numbers are converted first. */
export class ListUsersQuery {
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;
}
