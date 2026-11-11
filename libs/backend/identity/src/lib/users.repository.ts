import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE,
  type Database,
  type UserRow,
} from '@fitness-connect/database';

export interface UserWithPasswordHash {
  user: UserRow;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findById(id: string): Promise<UserRow | null> {
    void this.db;
    void id;
    throw new Error('not implemented');
  }

  /** The user and their dev password hash, or null when either is missing. */
  findWithDevCredentials(email: string): Promise<UserWithPasswordHash | null> {
    void email;
    throw new Error('not implemented');
  }
}
