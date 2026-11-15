import { toBookingDto, toBookingRequestDto, toSessionDto } from './booking.dto';
import type { BookingRow } from './bookings.repository';

describe('booking dto mappers', () => {
  const row: BookingRow = {
    id: 'b0000000-0000-4000-8000-000000000001',
    trainerUserId: 'f0000000-0000-4000-8000-000000000001',
    clientUserId: 'c0000000-0000-4000-8000-00000000000a',
    venueId: 'e0000000-0000-4000-8000-00000000000a',
    startsAt: new Date('2031-03-10T11:30:00Z'),
    durationMinutes: 60,
    priceMinor: 12050,
    currency: 'PLN',
    status: 'pending',
    requestedAt: new Date('2031-03-10T10:00:00Z'),
    expiresAt: new Date('2031-03-10T11:00:00Z'),
    decidedAt: null,
  };
  const venue = {
    name: 'Iron Hall Gym',
    area: 'Powisle',
    timeZone: 'Europe/Warsaw',
  };

  it('toBookingRequestDto maps a pending row with the client name and the venue summary', () => {
    expect(toBookingRequestDto(row, 'Casey Client', venue)).toEqual({
      id: row.id,
      clientName: 'Casey Client',
      startsAt: '2031-03-10T11:30:00.000Z',
      durationMinutes: 60,
      priceMinor: 12050,
      currency: 'PLN',
      venue,
      requestedAt: '2031-03-10T10:00:00.000Z',
      expiresAt: '2031-03-10T11:00:00.000Z',
    });
  });

  it('toSessionDto maps a confirmed row without a price', () => {
    const session = toSessionDto(
      { ...row, status: 'confirmed' },
      'Casey Client',
      venue,
    );

    expect(session).toEqual({
      id: row.id,
      clientName: 'Casey Client',
      startsAt: '2031-03-10T11:30:00.000Z',
      durationMinutes: 60,
      venue,
    });
    expect(session).not.toHaveProperty('priceMinor');
    expect(session).not.toHaveProperty('currency');
  });

  it('leaves out the address and every internal column', () => {
    const request = toBookingRequestDto(row, 'Casey Client', venue);
    const session = toSessionDto(row, 'Casey Client', venue);

    for (const dto of [request, session]) {
      expect(JSON.stringify(dto)).not.toMatch(/address/i);
      expect(dto).not.toHaveProperty('trainerUserId');
      expect(dto).not.toHaveProperty('clientUserId');
      expect(dto).not.toHaveProperty('venueId');
      expect(dto).not.toHaveProperty('status');
    }
  });

  it('toBookingDto maps a decided row', () => {
    expect(
      toBookingDto({
        ...row,
        status: 'confirmed',
        decidedAt: new Date('2031-03-10T10:20:00Z'),
      }),
    ).toEqual({
      id: row.id,
      status: 'confirmed',
      startsAt: '2031-03-10T11:30:00.000Z',
      decidedAt: '2031-03-10T10:20:00.000Z',
    });
  });

  it('toBookingDto keeps a missing decision time as null', () => {
    expect(toBookingDto(row).decidedAt).toBeNull();
  });
});
