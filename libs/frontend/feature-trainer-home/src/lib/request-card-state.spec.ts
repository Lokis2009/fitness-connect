import type { Booking, BookingRequest } from '@fitness-connect/data-access';
import {
  type CardAction,
  type CardState,
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
const booking: Booking = {
  id: 'b1',
  status: 'confirmed',
  startsAt: request.startsAt,
  decidedAt: '2026-11-15T09:30:00Z',
};
const declinedBooking: Booking = { ...booking, status: 'declined' };

function cardIn(state: CardState): RequestCard {
  return { request, state };
}

const idle = cardIn({ kind: 'idle' });
const submittingAccept = cardIn({ kind: 'submitting', action: 'accept' });
const submittingDecline = cardIn({ kind: 'submitting', action: 'decline' });

/** One card in every state, for the "nothing happens" rows of the transition table. */
const everyState: [string, RequestCard][] = [
  ['idle', idle],
  ['submitting', submittingAccept],
  ['accepted', cardIn({ kind: 'accepted', booking })],
  ['declined', cardIn({ kind: 'declined', booking: declinedBooking })],
  ['unavailable', cardIn({ kind: 'unavailable', reason: 'expired' })],
  ['expired', cardIn({ kind: 'expired' })],
  ['failed', cardIn({ kind: 'failed', action: 'accept' })],
];

describe('startSubmit', () => {
  it.each<CardAction>(['accept', 'decline'])('moves idle to submitting with %s', (action) => {
    expect(startSubmit(idle, action).state).toEqual({ kind: 'submitting', action });
  });

  it.each<[CardAction, CardAction]>([
    ['accept', 'accept'],
    ['accept', 'decline'],
    ['decline', 'accept'],
    ['decline', 'decline'],
  ])('moves failed (%s) to submitting with %s', (failedAction, action) => {
    const failed = cardIn({ kind: 'failed', action: failedAction });

    expect(startSubmit(failed, action).state).toEqual({ kind: 'submitting', action });
  });

  it('keeps the request', () => {
    expect(startSubmit(idle, 'accept').request).toBe(request);
  });

  it('does not change the card it is given', () => {
    startSubmit(idle, 'accept');

    expect(idle.state).toEqual({ kind: 'idle' });
  });

  it.each(everyState.filter(([name]) => name !== 'idle' && name !== 'failed'))(
    'leaves a %s card alone',
    (_name, card) => {
      expect(startSubmit(card, 'decline')).toBe(card);
    },
  );
});

describe('resolveSuccess', () => {
  it('moves a submitting accept to accepted and keeps the booking', () => {
    expect(resolveSuccess(submittingAccept, booking).state).toEqual({
      kind: 'accepted',
      booking,
    });
  });

  it('moves a submitting decline to declined and keeps the booking', () => {
    expect(resolveSuccess(submittingDecline, declinedBooking).state).toEqual({
      kind: 'declined',
      booking: declinedBooking,
    });
  });

  it('keeps the request', () => {
    expect(resolveSuccess(submittingAccept, booking).request).toBe(request);
  });

  it.each(everyState.filter(([name]) => name !== 'submitting'))(
    'leaves a %s card alone',
    (_name, card) => {
      expect(resolveSuccess(card, booking)).toBe(card);
    },
  );
});

describe('resolveError', () => {
  it.each<[string, number, string | undefined, CardState]>([
    ['409 booking-expired', 409, 'booking-expired', { kind: 'unavailable', reason: 'expired' }],
    ['409 booking-withdrawn', 409, 'booking-withdrawn', { kind: 'unavailable', reason: 'withdrawn' }],
    ['409 booking-not-pending', 409, 'booking-not-pending', { kind: 'unavailable', reason: 'answered' }],
    ['409 with an unknown code', 409, 'something-new', { kind: 'unavailable', reason: 'answered' }],
    ['409 without a code', 409, undefined, { kind: 'unavailable', reason: 'answered' }],
    ['404', 404, undefined, { kind: 'unavailable', reason: 'answered' }],
    ['404 with a code', 404, 'not-found', { kind: 'unavailable', reason: 'answered' }],
  ])('moves a submitting card to unavailable on %s', (_name, status, code, expected) => {
    expect(resolveError(submittingAccept, status, code).state).toEqual(expected);
  });

  it.each<[string, number, string | undefined]>([
    ['a network error', 0, undefined],
    ['a 500', 500, undefined],
    ['a 502', 502, undefined],
    ['a 503', 503, undefined],
    ['a 403 trainer-not-approved', 403, 'trainer-not-approved'],
    ['a 401', 401, undefined],
    ['a 400', 400, undefined],
  ])('moves a submitting card to failed on %s', (_name, status, code) => {
    expect(resolveError(submittingAccept, status, code).state).toEqual({
      kind: 'failed',
      action: 'accept',
    });
  });

  it('keeps the action of a failed decline', () => {
    expect(resolveError(submittingDecline, 503).state).toEqual({
      kind: 'failed',
      action: 'decline',
    });
  });

  it('keeps the request', () => {
    expect(resolveError(submittingAccept, 409, 'booking-expired').request).toBe(request);
  });

  it.each(everyState.filter(([name]) => name !== 'submitting'))(
    'leaves a %s card alone',
    (_name, card) => {
      expect(resolveError(card, 409, 'booking-expired')).toBe(card);
    },
  );
});

describe('expireCard', () => {
  it('moves idle to expired', () => {
    expect(expireCard(idle).state).toEqual({ kind: 'expired' });
  });

  it('keeps the request so the card keeps its details', () => {
    expect(expireCard(idle).request).toBe(request);
  });

  it.each(everyState.filter(([name]) => name !== 'idle'))(
    'leaves a %s card alone',
    (_name, card) => {
      expect(expireCard(card)).toBe(card);
    },
  );
});

describe('a full answer', () => {
  it('goes idle, submitting, accepted', () => {
    const accepted = resolveSuccess(startSubmit(idle, 'accept'), booking);

    expect(accepted.state).toEqual({ kind: 'accepted', booking });
  });

  it('goes idle, submitting, failed, submitting again, declined', () => {
    const failed = resolveError(startSubmit(idle, 'decline'), 503);
    const retried = startSubmit(failed, 'decline');

    expect(resolveSuccess(retried, declinedBooking).state).toEqual({
      kind: 'declined',
      booking: declinedBooking,
    });
  });

  it('stays resolved when the clock passes the deadline afterwards', () => {
    const accepted = resolveSuccess(startSubmit(idle, 'accept'), booking);

    expect(expireCard(accepted)).toBe(accepted);
  });
});
