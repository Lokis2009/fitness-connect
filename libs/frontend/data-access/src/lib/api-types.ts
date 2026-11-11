import type { components } from '@fitness-connect/api-contract';

type Schemas = components['schemas'];

/** A user role, as defined by the API contract. */
export type Role = Schemas['Role'];
/** A user, as returned by `GET /v1/me`. */
export type User = Schemas['User'];
/** Response body of `GET /v1/health`. */
export type HealthStatus = Schemas['HealthStatus'];
/** Request body of `POST /v1/dev/login`. */
export type DevLoginRequest = Schemas['DevLoginRequest'];
/** Response body of `POST /v1/dev/login`. */
export type DevLoginResponse = Schemas['DevLoginResponse'];
/** RFC 9457 problem details, the shape of every API error body. */
export type Problem = Schemas['Problem'];
