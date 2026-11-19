import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SessionsQueryDto } from './sessions-query.dto';

async function errorsFor(query: Record<string, unknown>) {
  const errors = await validate(plainToInstance(SessionsQueryDto, query), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property).sort();
}

describe('SessionsQueryDto', () => {
  it.each([
    ['Z instants', '2031-03-10T00:00:00Z', '2031-03-12T00:00:00Z'],
    ['offsets', '2031-03-10T00:00:00+01:00', '2031-03-11T23:00:00-05:00'],
    [
      'fractions of a second',
      '2031-03-10T00:00:00.250Z',
      '2031-03-10T00:00:01Z',
    ],
  ])('accepts %s', async (_name, from, to) => {
    await expect(errorsFor({ from, to })).resolves.toEqual([]);
  });

  it('accepts a span of exactly 7 days', async () => {
    await expect(
      errorsFor({ from: '2031-03-10T00:00:00Z', to: '2031-03-17T00:00:00Z' }),
    ).resolves.toEqual([]);
  });

  it('rejects a span over 7 days', async () => {
    await expect(
      errorsFor({ from: '2031-03-10T00:00:00Z', to: '2031-03-17T00:00:01Z' }),
    ).resolves.toEqual(['to']);
  });

  it('rejects from equal to to and from after to', async () => {
    await expect(
      errorsFor({ from: '2031-03-10T00:00:00Z', to: '2031-03-10T00:00:00Z' }),
    ).resolves.toEqual(['to']);
    await expect(
      errorsFor({ from: '2031-03-11T00:00:00Z', to: '2031-03-10T00:00:00Z' }),
    ).resolves.toEqual(['to']);
  });

  it.each([
    ['a bare date', '2031-03-10'],
    ['a date-time without an offset', '2031-03-10T00:00:00'],
    ['an offset without a colon', '2031-03-10T00:00:00+0100'],
    ['a calendar date that does not exist', '2031-02-30T00:00:00Z'],
    ['an hour past 23', '2031-03-10T24:00:00Z'],
    ['free text', 'tomorrow'],
    ['an empty string', ''],
  ])('rejects %s', async (_name, value) => {
    await expect(
      errorsFor({ from: value, to: '2031-03-12T00:00:00Z' }),
    ).resolves.toEqual(['from']);
    await expect(
      errorsFor({ from: '2031-03-10T00:00:00Z', to: value }),
    ).resolves.toEqual(['to']);
  });

  it('rejects missing and non-string values', async () => {
    await expect(errorsFor({})).resolves.toEqual(['from', 'to']);
    await expect(errorsFor({ from: 5, to: ['x'] })).resolves.toEqual([
      'from',
      'to',
    ]);
  });

  it('rejects unknown properties', async () => {
    await expect(
      errorsFor({
        from: '2031-03-10T00:00:00Z',
        to: '2031-03-12T00:00:00Z',
        extra: '1',
      }),
    ).resolves.toEqual(['extra']);
  });
});
