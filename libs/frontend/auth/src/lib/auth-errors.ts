import type { Role } from '@fitness-connect/data-access';

/** The API rejected the email or password (HTTP 401). */
export class InvalidCredentialsError extends Error {
  override readonly name = 'InvalidCredentialsError';

  constructor(options?: ErrorOptions) {
    super('Invalid email or password', options);
  }
}

/** The credentials are valid but the account has a different role than the app expects. */
export class WrongRoleError extends Error {
  override readonly name = 'WrongRoleError';

  constructor(
    readonly expected: Role,
    readonly actual: Role,
  ) {
    super(`This account is a ${actual}, expected a ${expected}`);
  }
}
