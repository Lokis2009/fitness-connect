import type { Booking, BookingRequest } from '@fitness-connect/data-access';
import {
  type RequestCard,
  expireCard,
  resolveError,
  resolveSuccess,
  startSubmit,
} from './request-card-state';

const request: BookingRequest = {
  id: 'b1',
  clientName: 'Casey Client',
  startsAt: '2026-11-16T10:00:00Z',
  durationMinutes: 60,
  priceMinor: 12000,
  currency: 'PLN',
  venue: { name: 'Iron Hall Gym', area: 'Mokotow', timeZone: 'Europe/Warsaw' },
  requestedAt: '2026-11-15T09:00:00Z',
  expiresAt: '2026-11-15T10:00:00Z',
};
const card: RequestCard = { request, state: { kind: 'idle' } };
const booking: Booking = {
  id: 'b1',
  status: 'confirmed',
  startsAt: request.startsAt,
  decidedAt: '2026-11-15T09:30:00Z',
};

describe('request card state (stubs)', () => {
  it('startSubmit is not implemented yet', () => {
    expect(() => startSubmit(card, 'accept')).toThrow('not implemented');
  });

  it('resolveSuccess is not implemented yet', () => {
    expect(() => resolveSuccess(card, booking)).toThrow('not implemented');
  });

  it('resolveError is not implemented yet', () => {
    expect(() => resolveError(card, 409, 'booking-expired')).toThrow('not implemented');
  });

  it('expireCard is not implemented yet', () => {
    expect(() => expireCard(card)).toThrow('not implemented');
  });
});
