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
  void row;
  void clientName;
  void venue;
  throw new Error('not implemented');
}

/** Maps a confirmed row to a `Session`. It has no price. */
export function toSessionDto(
  row: BookingRow,
  clientName: string,
  venue: VenueSummaryDto,
): SessionDto {
  void row;
  void clientName;
  void venue;
  throw new Error('not implemented');
}

/** Maps a decided row to the `Booking` result of accept and decline. */
export function toBookingDto(row: BookingRow): BookingDto {
  void row;
  throw new Error('not implemented');
}
