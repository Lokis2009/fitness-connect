import { InvalidCredentialsError, WrongRoleError } from './auth-errors';

describe('auth errors', () => {
  it('InvalidCredentialsError is a named Error and keeps its cause', () => {
    const cause = new Error('401');
    const error = new InvalidCredentialsError({ cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvalidCredentialsError');
    expect(error.cause).toBe(cause);
  });

  it('WrongRoleError exposes the expected and the actual role', () => {
    const error = new WrongRoleError('trainer', 'client');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('WrongRoleError');
    expect(error.expected).toBe('trainer');
    expect(error.actual).toBe('client');
    expect(error.message).toContain('client');
    expect(error.message).toContain('trainer');
  });
});
