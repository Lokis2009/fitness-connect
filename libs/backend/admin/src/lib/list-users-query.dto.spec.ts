import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListUsersQuery } from './list-users-query.dto';

/** Converts and validates a raw query the way the global validation pipe does. */
async function parse(query: Record<string, unknown>) {
  const instance = plainToInstance(ListUsersQuery, query);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { instance, errors: errors.map((error) => error.property).sort() };
}

describe('ListUsersQuery', () => {
  it('defaults to the first page of 25 users of every role', async () => {
    const { instance, errors } = await parse({});

    expect(errors).toEqual([]);
    expect(instance).toMatchObject({ page: 1, pageSize: 25 });
    expect(instance.role).toBeUndefined();
  });

  it('converts page and pageSize from query strings to numbers', async () => {
    const { instance, errors } = await parse({ page: '3', pageSize: '10' });

    expect(errors).toEqual([]);
    expect(instance).toMatchObject({ page: 3, pageSize: 10 });
  });

  it.each(['client', 'trainer', 'admin'])('accepts role %s', async (role) => {
    const { instance, errors } = await parse({ role });

    expect(errors).toEqual([]);
    expect(instance.role).toBe(role);
  });

  it.each(['1', '100'])('accepts pageSize %s', async (pageSize) => {
    await expect(parse({ pageSize })).resolves.toMatchObject({ errors: [] });
  });

  it.each([
    ['page', '0'],
    ['page', '-1'],
    ['page', '1.5'],
    ['page', 'abc'],
    ['page', ''],
    ['pageSize', '0'],
    ['pageSize', '101'],
    ['pageSize', '2.5'],
    ['pageSize', 'many'],
    ['role', 'superuser'],
    ['role', 'Admin'],
    ['role', ''],
  ])('rejects %s=%j', async (property, value) => {
    await expect(parse({ [property]: value })).resolves.toMatchObject({
      errors: [property],
    });
  });

  it('rejects unknown parameters', async () => {
    await expect(parse({ search: 'casey' })).resolves.toMatchObject({
      errors: ['search'],
    });
  });
});
