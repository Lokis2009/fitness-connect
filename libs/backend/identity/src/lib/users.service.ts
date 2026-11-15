import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '@fitness-connect/database';

/** The public lookups of the identity module, for other modules to call. */
@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Display names for the given user ids, keyed by id. Unknown or malformed ids are left out. */
  displayNames(ids: string[]): Promise<Map<string, string>> {
    void ids;
    void this.db;
    throw new Error('not implemented');
  }
}
