import type { components } from '@fitness-connect/api-contract';
import type { BookingRow } from './bookings.repository';

export type BookingRequestDto = components['schemas']['BookingRequest'];
export type BookingRequestListDto = components['schemas']['BookingRequestList'];
export type SessionDto = components['schemas']['Session'];
export type SessionListDto = components['schemas']['SessionList'];
export type BookingDto = components['schemas']['Booking'];
export type VenueSummaryDto = components['schemas']['VenueSummary'];

/** Maps a pending row to a `BookingRequest`. Leaves out the address and internal columns. */
export function toBookingRequestDto(
  row: BookingRow,
  clientName: string,
  venue: VenueSummaryDto,
): BookingRequestDto {
  return {
    id: row.id,
    clientName,
    startsAt: row.startsAt.toISOString(),
    durationMinutes: row.durationMinutes,
    priceMinor: row.priceMinor,
    currency: row.currency,
    venue: toVenueSummary(venue),
    requestedAt: row.requestedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** Maps a confirmed row to a `Session`. It has no price. */
export function toSessionDto(
  row: BookingRow,
  clientName: string,
  venue: VenueSummaryDto,
): SessionDto {
  return {
    id: row.id,
    clientName,
    startsAt: row.startsAt.toISOString(),
    durationMinutes: row.durationMinutes,
    venue: toVenueSummary(venue),
  };
}

/** Maps a decided row to the `Booking` result of accept and decline. */
export function toBookingDto(row: BookingRow): BookingDto {
  return {
    id: row.id,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  };
}

/** Copies the three public fields, so nothing else a lookup returns reaches a response. */
function toVenueSummary(venue: VenueSummaryDto): VenueSummaryDto {
  return { name: venue.name, area: venue.area, timeZone: venue.timeZone };
}
