const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether `value` is a UUID and nothing else. Repositories use it to answer "not found" for a
 * malformed id, instead of letting the database fail on the type.
 */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
