import { EnvValidationError, validateEnv } from './env';

const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://fitness:fitness@localhost:5432/fitness_connect',
  JWT_DEV_SECRET: 'dev-only-secret-of-at-least-32-characters',
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    expect(validateEnv(valid)).toEqual({
      NODE_ENV: 'development',
      API_PORT: 3000,
      CORS_ORIGINS: [],
      DATABASE_URL: valid.DATABASE_URL,
      JWT_DEV_SECRET: valid.JWT_DEV_SECRET,
    });
  });

  it('parses the port and a comma separated CORS allow-list', () => {
    const env = validateEnv({
      ...valid,
      NODE_ENV: 'test',
      API_PORT: '4010',
      CORS_ORIGINS: ' http://localhost:4200, http://localhost:4201 ,,',
    });

    expect(env.NODE_ENV).toBe('test');
    expect(env.API_PORT).toBe(4010);
    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:4200',
      'http://localhost:4201',
    ]);
  });

  it('does not require a dev secret in production', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: valid.DATABASE_URL,
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.JWT_DEV_SECRET).toBeUndefined();
  });

  it.each([
    ['an unknown NODE_ENV', { NODE_ENV: 'staging' }, 'NODE_ENV'],
    ['a missing NODE_ENV', { NODE_ENV: undefined }, 'NODE_ENV'],
    ['a blank NODE_ENV', { NODE_ENV: '' }, 'NODE_ENV'],
    ['a dev secret shorter than 32 characters', { JWT_DEV_SECRET: 'short' }, 'JWT_DEV_SECRET'],
    ['a non numeric port', { API_PORT: 'abc' }, 'API_PORT'],
    ['a port of zero', { API_PORT: '0' }, 'API_PORT'],
    ['a port above 65535', { API_PORT: '65536' }, 'API_PORT'],
    ['a fractional port', { API_PORT: '30.5' }, 'API_PORT'],
    ['a missing database url', { DATABASE_URL: undefined }, 'DATABASE_URL'],
    ['a blank database url', { DATABASE_URL: '  ' }, 'DATABASE_URL'],
    [
      'a database url that is not postgres',
      { DATABASE_URL: 'mysql://localhost/db' },
      'DATABASE_URL',
    ],
    [
      'a database url that is not a url',
      { DATABASE_URL: 'not a url' },
      'DATABASE_URL',
    ],
    [
      'a missing dev secret outside production',
      { JWT_DEV_SECRET: undefined },
      'JWT_DEV_SECRET',
    ],
    [
      'a blank dev secret outside production',
      { JWT_DEV_SECRET: '' },
      'JWT_DEV_SECRET',
    ],
    [
      'a dev secret in production',
      { NODE_ENV: 'production' },
      'JWT_DEV_SECRET',
    ],
  ])('rejects %s', (_name, override, variable) => {
    expect(() => validateEnv({ ...valid, ...override })).toThrow(
      EnvValidationError,
    );
    expect(() => validateEnv({ ...valid, ...override })).toThrow(variable);
  });

  it('reports every problem at once', () => {
    let message = '';
    try {
      validateEnv({ NODE_ENV: 'nope', API_PORT: 'x' });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('NODE_ENV');
    expect(message).toContain('API_PORT');
    expect(message).toContain('DATABASE_URL');
    expect(message).toContain('JWT_DEV_SECRET');
  });
});
