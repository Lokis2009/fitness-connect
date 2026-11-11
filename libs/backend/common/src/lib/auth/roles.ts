import type { components } from '@fitness-connect/api-contract';

type ContractRole = components['schemas']['Role'];

/** Runtime list of roles. The `satisfies` keeps it in step with the OpenAPI contract. */
export const ROLES = [
  'client',
  'trainer',
  'admin',
] as const satisfies readonly ContractRole[];

export type Role = (typeof ROLES)[number];
