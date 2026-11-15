import type { components } from '@fitness-connect/api-contract';
import type {
  TrainerProfileRow,
  VenueRow,
} from './trainer-profiles.repository';

export type TrainerStatus = components['schemas']['TrainerStatus'];

/** The three trainer fields of the `User` contract schema. */
export interface TrainerUserFields {
  trainerStatus: TrainerStatus | null;
  trainerStatusNote: string | null;
  trainerVenueTimeZone: string | null;
}

/** Maps a stored profile and venue to the fields on `User`. A missing profile reads as `incomplete`. */
export function toTrainerUserFields(
  profile: TrainerProfileRow | null,
  venue: VenueRow | null,
): TrainerUserFields {
  void profile;
  void venue;
  throw new Error('not implemented');
}
