import { validateSchema, type Schema } from './json-schema';

const user: Schema = {
  type: 'object',
  required: ['id', 'email', 'role'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['client', 'trainer', 'admin'] },
    age: { type: 'integer' },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

const valid = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  email: 'client@example.com',
  role: 'client',
};

describe('validateSchema', () => {
  it('accepts a conforming value', () => {
    expect(validateSchema(user, { ...valid, age: 3, tags: ['a'] })).toEqual([]);
  });

  it.each([
    [
      'a missing required property',
      { id: valid.id, email: valid.email },
      /missing required property "role"/,
    ],
    ['a wrong type', { ...valid, age: 'three' }, /\$\.age: expected integer/],
    ['a fractional integer', { ...valid, age: 1.5 }, /expected integer/],
    ['a value outside the enum', { ...valid, role: 'root' }, /not one of/],
    ['an invalid uuid', { ...valid, id: 'abc' }, /not a valid uuid/],
    ['an invalid email', { ...valid, email: 'nope' }, /not a valid email/],
    [
      'a wrong item type',
      { ...valid, tags: ['a', 2] },
      /\$\.tags\[1\]: expected string/,
    ],
    ['a non object', 'text', /expected object/],
    ['null', null, /expected object, got null/],
    ['an array', [], /expected object, got array/],
  ])('reports %s', (_name, value, message) => {
    const errors = validateSchema(user, value);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join('\n')).toMatch(message);
  });

  it('ignores extra properties unless strict', () => {
    const withExtra = { ...valid, passwordHash: 'x' };

    expect(validateSchema(user, withExtra)).toEqual([]);
    expect(validateSchema(user, withExtra, { strict: true })).toEqual([
      '$: unexpected property "passwordHash"',
    ]);
  });

  it('honours additionalProperties false', () => {
    expect(
      validateSchema({ type: 'object', additionalProperties: false }, { a: 1 }),
    ).toEqual(['$: unexpected property "a"']);
  });

  it('checks string length', () => {
    const schema: Schema = { type: 'string', minLength: 2, maxLength: 3 };

    expect(validateSchema(schema, 'a')).toHaveLength(1);
    expect(validateSchema(schema, 'abcd')).toHaveLength(1);
    expect(validateSchema(schema, 'abc')).toEqual([]);
  });

  it('supports type unions and numbers', () => {
    const schema: Schema = { type: ['number', 'null'] };

    expect(validateSchema(schema, 1)).toEqual([]);
    expect(validateSchema(schema, 1.5)).toEqual([]);
    expect(validateSchema(schema, null)).toEqual([]);
    expect(validateSchema(schema, 'x')).toHaveLength(1);
  });

  it('accepts a date-time', () => {
    const schema: Schema = { type: 'string', format: 'date-time' };

    expect(validateSchema(schema, '2026-01-01T00:00:00.000Z')).toEqual([]);
    expect(validateSchema(schema, 'yesterday')).toHaveLength(1);
  });

  it('throws on keywords and formats it does not understand', () => {
    expect(() => validateSchema({ oneOf: [] } as unknown as Schema, 1)).toThrow(
      /Unsupported schema keyword "oneOf"/,
    );
    expect(() =>
      validateSchema({ type: 'string', format: 'hostname' }, 'x'),
    ).toThrow(/Unsupported format "hostname"/);
  });
});
