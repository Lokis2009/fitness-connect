import { toBookingDto, toBookingRequestDto, toSessionDto } from './booking.dto';
import type { BookingRow } from './bookings.repository';

describe('booking dto mappers', () => {
  const row = {} as BookingRow;
  const venue = { name: 'Iron Hall Gym', area: 'Powisle', timeZone: 'UTC' };

  it('toBookingRequestDto is not implemented yet', () => {
    expect(() => toBookingRequestDto(row, 'Casey', venue)).toThrow(
      'not implemented',
    );
  });

  it('toSessionDto is not implemented yet', () => {
    expect(() => toSessionDto(row, 'Casey', venue)).toThrow('not implemented');
  });

  it('toBookingDto is not implemented yet', () => {
    expect(() => toBookingDto(row)).toThrow('not implemented');
  });
});
