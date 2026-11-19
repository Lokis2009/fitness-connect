import { Injectable } from '@nestjs/common';
import type { components } from '@fitness-connect/api-contract';
import type { Role } from '@fitness-connect/common';
import { TrainerProfilesRepository } from './trainer-profiles.repository';
import {
  NO_TRAINER_FIELDS,
  toTrainerUserFields,
  type TrainerUserFields,
} from './trainer-user-fields';

export type VenueSummary = components['schemas']['VenueSummary'];

@Injectable()
export class TrainersService {
  constructor(private readonly profiles: TrainerProfilesRepository) {}

  /** The trainer fields of `User`. All null unless the role is trainer. */
  async getUserTrainerFields(user: {
    id: string;
    role: Role;
  }): Promise<TrainerUserFields> {
    if (user.role !== 'trainer') return { ...NO_TRAINER_FIELDS };

    const [profile, venue] = await Promise.all([
      this.profiles.findProfile(user.id),
      this.profiles.findOldestVenue(user.id),
    ]);
    return toTrainerUserFields(profile, venue);
  }

  /** True when the trainer's status is `approved`. */
  async isApproved(userId: string): Promise<boolean> {
    const profile = await this.profiles.findProfile(userId);
    return profile?.status === 'approved';
  }

  /** Venue summaries for the given venue ids, keyed by id. No address. */
  async venuesByIds(ids: string[]): Promise<Map<string, VenueSummary>> {
    if (ids.length === 0) return new Map();

    const rows = await this.profiles.findVenuesByIds(ids);
    return new Map(
      rows.map(({ id, name, area, timeZone }) => [
        id,
        { name, area, timeZone },
      ]),
    );
  }
}
