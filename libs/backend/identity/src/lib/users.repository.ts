import { Inject, Injectable } from '@nestjs/common';
import { isUuid, type Role } from '@fitness-connect/common';
import {
  DATABASE,
  devCredentials,
  users,
  type Database,
  type UserRow,
} from '@fitness-connect/database';
import { eq, sql } from 'drizzle-orm';

export interface UserWithPasswordHash {
  user: UserRow;
  passwordHash: string;
}

export interface ListUsersOptions {
  role?: Role;
  /** One-based page number. */
  page: number;
  pageSize: number;
}

export interface UserPage {
  rows: UserRow[];
  /** Number of users matching the role filter across all pages. */
  total: number;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string): Promise<UserRow | null> {
    // A malformed id is simply "not found" instead of a database type error.
    if (!isUuid(id)) return null;

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  /** One page of users, newest first (`created_at` descending, then `id` descending), optionally of one role. */
  async listPage(options: ListUsersOptions): Promise<UserPage> {
    void options;
    void this.db;
    throw new Error('not implemented');
  }

  /** The user and their dev password hash, or null when either is missing. The email match ignores case. */
  async findWithDevCredentials(
    email: string,
  ): Promise<UserWithPasswordHash | null> {
    const [found] = await this.db
      .select({ user: users, passwordHash: devCredentials.passwordHash })
      .from(users)
      .innerJoin(devCredentials, eq(devCredentials.userId, users.id))
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return found ?? null;
  }
}
