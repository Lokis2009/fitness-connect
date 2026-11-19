import { Inject, Injectable } from '@nestjs/common';
import { isUuid } from '@fitness-connect/common';
import {
  DATABASE,
  trainerProfiles,
  venues,
  type Database,
} from '@fitness-connect/database';
import { asc, eq, inArray } from 'drizzle-orm';

/** A trainer's stored profile. */
export interface TrainerProfileRow {
  userId: string;
  status: 'incomplete' | 'submitted' | 'changes_requested' | 'approved';
  statusNote: string | null;
}

/** A stored venue, without the address: nothing outside the owner needs it (PDR-013). */
export interface VenueRow {
  id: string;
  trainerUserId: string;
  name: string;
  area: string;
  timeZone: string;
}


const VENUE_COLUMNS = {
  id: venues.id,
  trainerUserId: venues.trainerUserId,
  name: venues.name,
  area: venues.area,
  timeZone: venues.timeZone,
};

@Injectable()
export class TrainerProfilesRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** The profile of a trainer, or null when there is no row yet (or the id is malformed). */
  async findProfile(userId: string): Promise<TrainerProfileRow | null> {
    if (!isUuid(userId)) return null;

    const [profile] = await this.db
      .select({
        userId: trainerProfiles.userId,
        status: trainerProfiles.status,
        statusNote: trainerProfiles.statusNote,
      })
      .from(trainerProfiles)
      .where(eq(trainerProfiles.userId, userId))
      .limit(1);
    return profile ?? null;
  }

  /** The trainer's oldest venue by `created_at`, or null when there is none. */
  async findOldestVenue(userId: string): Promise<VenueRow | null> {
    if (!isUuid(userId)) return null;

    const [venue] = await this.db
      .select(VENUE_COLUMNS)
      .from(venues)
      .where(eq(venues.trainerUserId, userId))
      .orderBy(asc(venues.createdAt), asc(venues.id))
      .limit(1);
    return venue ?? null;
  }

  /** The venues with the given ids. Ids that are not uuids match nothing. */
  async findVenuesByIds(ids: string[]): Promise<VenueRow[]> {
    const valid = ids.filter((id) => isUuid(id));
    if (valid.length === 0) return [];

    return this.db
      .select(VENUE_COLUMNS)
      .from(venues)
      .where(inArray(venues.id, valid));
  }
}
