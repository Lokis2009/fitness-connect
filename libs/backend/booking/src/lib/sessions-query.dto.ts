/**
 * Query of `GET /trainers/me/sessions`. Validation (full ISO 8601 date-times
 * with `Z` or an offset, `from` before `to`, span at most 7 days) comes with
 * the implementation.
 */
export class SessionsQueryDto {
  from!: string;
  to!: string;
}
