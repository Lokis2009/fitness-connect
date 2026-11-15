import { Injectable } from '@nestjs/common';

/** A trainer's stored profile. The columns come with the database schema. */
export interface TrainerProfileRow {
  userId: string;
  status: 'incomplete' | 'submitted' | 'changes_requested' | 'approved';
  statusNote: string | null;
}

/** A stored venue. The columns come with the database schema. */
export interface VenueRow {
  id: string;
  trainerUserId: string;
  name: string;
  area: string;
  timeZone: string;
}

@Injectable()
export class TrainerProfilesRepository {
  /** The profile of a trainer, or null when there is no row yet. */
  findProfile(userId: string): Promise<TrainerProfileRow | null> {
    void userId;
    throw new Error('not implemented');
  }

  /** The trainer's oldest venue by `created_at`, or null when there is none. */
  findOldestVenue(userId: string): Promise<VenueRow | null> {
    void userId;
    throw new Error('not implemented');
  }
}
