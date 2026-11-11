/**
 * A small JSON Schema validator for the subset of keywords the OpenAPI
 * contract uses. It exists so contract tests do not need another package.
 * Any keyword it does not understand throws instead of passing silently, so
 * extending the contract cannot make the conformance test vacuous.
 */
export interface Schema {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  format?: string;
  additionalProperties?: boolean;
  minLength?: number;
  maxLength?: number;
  // Annotations without any effect on validation.
  title?: string;
  description?: string;
  example?: unknown;
  examples?: unknown;
}

const ANNOTATIONS = ['title', 'description', 'example', 'examples'];
const KEYWORDS = new Set([
  'type',
  'required',
  'properties',
  'items',
  'enum',
  'format',
  'additionalProperties',
  'minLength',
  'maxLength',
  ...ANNOTATIONS,
]);

const FORMATS: Record<string, RegExp> = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'date-time':
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
};

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function matchesType(type: string, value: unknown): boolean {
  const actual = typeOf(value);
  return actual === type || (type === 'number' && actual === 'integer');
}

/**
 * Returns a list of human readable violations, empty when `value` conforms.
 * With `strict`, properties that the schema does not declare are violations
 * too, which catches fields leaking out of an endpoint.
 */
export function validateSchema(
  schema: Schema,
  value: unknown,
  options: { strict?: boolean } = {},
  path = '$',
): string[] {
  for (const keyword of Object.keys(schema)) {
    if (!KEYWORDS.has(keyword)) {
      throw new Error(`Unsupported schema keyword "${keyword}" at ${path}`);
    }
  }

  const errors: string[] = [];

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesType(type, value))) {
      return [`${path}: expected ${types.join(' or ')}, got ${typeOf(value)}`];
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(
      `${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`,
    );
  }

  if (typeof value === 'string') {
    if (schema.format) {
      const pattern = FORMATS[schema.format];
      if (!pattern) {
        throw new Error(`Unsupported format "${schema.format}" at ${path}`);
      }
      if (!pattern.test(value)) {
        errors.push(`${path}: "${value}" is not a valid ${schema.format}`);
      }
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: shorter than ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path}: longer than ${schema.maxLength}`);
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      errors.push(
        ...validateSchema(
          schema.items as Schema,
          item,
          options,
          `${path}[${index}]`,
        ),
      );
    });
  }

  if (typeOf(value) === 'object') {
    const object = value as Record<string, unknown>;
    for (const name of schema.required ?? []) {
      if (!(name in object))
        errors.push(`${path}: missing required property "${name}"`);
    }
    for (const [name, propertySchema] of Object.entries(
      schema.properties ?? {},
    )) {
      if (name in object) {
        errors.push(
          ...validateSchema(
            propertySchema,
            object[name],
            options,
            `${path}.${name}`,
          ),
        );
      }
    }
    const closed = options.strict || schema.additionalProperties === false;
    if (closed) {
      for (const name of Object.keys(object)) {
        if (!(name in (schema.properties ?? {}))) {
          errors.push(`${path}: unexpected property "${name}"`);
        }
      }
    }
  }

  return errors;
}
