import type { Role } from './roles';

/** The caller as established by a verified token. `id` is the token `sub` claim. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** The slice of the HTTP request the auth guards need, independent of the HTTP platform. */
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}
