import type { AuthUser } from './auth-user';

/**
 * Turns a bearer token into the caller. Implementations throw when the token
 * is invalid or expired. The dev HS256 verifier lives in the identity lib; a
 * Cognito JWKS verifier will be another implementation of this interface.
 */
export interface TokenVerifier {
  verify(token: string): Promise<AuthUser>;
}

/** Injection token the JWT guard uses to find the verifier. */
export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');
