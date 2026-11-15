import { Injectable } from '@nestjs/common';
import type { components } from '@fitness-connect/api-contract';
import type { Role } from '@fitness-connect/common';
import { TrainerProfilesRepository } from './trainer-profiles.repository';
import type { TrainerUserFields } from './trainer-user-fields';

export type VenueSummary = components['schemas']['VenueSummary'];

@Injectable()
export class TrainersService {
  constructor(private readonly profiles: TrainerProfilesRepository) {}

  /** The trainer fields of `User`. All null unless the role is trainer. */
  getUserTrainerFields(user: {
    id: string;
    role: Role;
  }): Promise<TrainerUserFields> {
    void user;
    void this.profiles;
    throw new Error('not implemented');
  }

  /** True when the trainer's status is `approved`. */
  isApproved(userId: string): Promise<boolean> {
    void userId;
    throw new Error('not implemented');
  }

  /** Venue summaries for the given venue ids, keyed by id. No address. */
  venuesByIds(ids: string[]): Promise<Map<string, VenueSummary>> {
    void ids;
    throw new Error('not implemented');
  }
}
