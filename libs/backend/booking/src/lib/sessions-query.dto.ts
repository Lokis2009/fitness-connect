import {
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/** The longest range `GET /trainers/me/sessions` answers. */
export const MAX_SESSIONS_SPAN_MS = 7 * 24 * 60 * 60 * 1000;

// Full date and time, seconds included, with `Z` or an offset with a colon.
const INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/** The instant in epoch milliseconds, or null unless `value` is a full ISO 8601 date-time with `Z` or an offset. */
function parseInstant(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = INSTANT.exec(value);
  if (!match) return null;

  // Date.parse rolls 30 February over to March, so check the calendar date as well.
  const [year, month, day] = [match[1], match[2], match[3]].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

@ValidatorConstraint({ name: 'isInstantWithZone', async: false })
class IsInstantWithZone implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return parseInstant(value) !== null;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a full ISO 8601 date-time with Z or an offset`;
  }
}

@ValidatorConstraint({ name: 'isRangeEnd', async: false })
class IsRangeEnd implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const from = parseInstant((args.object as SessionsQueryDto).from);
    const to = parseInstant(value);
    // A bad `from` or `to` is reported by its own check.
    if (from === null || to === null) return true;
    return from < to && to - from <= MAX_SESSIONS_SPAN_MS;
  }

  defaultMessage(): string {
    return 'from must be before to, and the range at most 7 days';
  }
}

/**
 * Query of `GET /trainers/me/sessions`: full ISO 8601 date-times with `Z` or
 * an offset, `from` before `to`, a span of at most 7 days.
 */
export class SessionsQueryDto {
  @Validate(IsInstantWithZone)
  from!: string;

  @Validate(IsInstantWithZone)
  @Validate(IsRangeEnd)
  to!: string;
}
