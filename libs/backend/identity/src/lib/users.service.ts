import { Inject, Injectable } from '@nestjs/common';
import { isUuid } from '@fitness-connect/common';
import { DATABASE, users, type Database } from '@fitness-connect/database';
import { inArray } from 'drizzle-orm';


/** The public lookups of the identity module, for other modules to call. */
@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Display names for the given user ids, keyed by id. Unknown or malformed ids are left out. */
  async displayNames(ids: string[]): Promise<Map<string, string>> {
    const valid = [...new Set(ids.filter((id) => isUuid(id)))];
    if (valid.length === 0) return new Map();

    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, valid));
    return new Map(rows.map((row) => [row.id, row.displayName]));
  }
}
