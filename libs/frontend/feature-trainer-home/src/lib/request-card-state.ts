import type { Booking, BookingRequest } from '@fitness-connect/data-access';

/** The answer a trainer gives to a request. */
export type CardAction = 'accept' | 'decline';

/** Why a request can no longer be answered. */
export type UnavailableReason = 'expired' | 'withdrawn' | 'answered';

/** Per-card state of the request state machine. */
export type CardState =
  | { kind: 'idle' }
  | { kind: 'submitting'; action: CardAction }
  | { kind: 'accepted'; booking: Booking }
  | { kind: 'declined'; booking: Booking }
  | { kind: 'unavailable'; reason: UnavailableReason }
  | { kind: 'expired' }
  | { kind: 'failed'; action: CardAction };

/** A pending request together with its state. */
export interface RequestCard {
  request: BookingRequest;
  state: CardState;
}

function withState(card: RequestCard, state: CardState): RequestCard {
  return { request: card.request, state };
}

/**
 * `idle` or `failed` to `submitting`, keeping the action. Any other state is returned as it is,
 * so a double tap or a late event cannot move a resolved card.
 */
export function startSubmit(card: RequestCard, action: CardAction): RequestCard {
  const { kind } = card.state;
  if (kind !== 'idle' && kind !== 'failed') {
    return card;
  }
  return withState(card, { kind: 'submitting', action });
}

/** `submitting` to `accepted` or `declined` on a 200. Any other state is returned as it is. */
export function resolveSuccess(card: RequestCard, booking: Booking): RequestCard {
  if (card.state.kind !== 'submitting') {
    return card;
  }
  return withState(card, {
    kind: card.state.action === 'accept' ? 'accepted' : 'declined',
    booking,
  });
}

function unavailableReason(status: number, code?: string): UnavailableReason | null {
  if (status === 404) {
    // A 404 hides whether the id is unknown or another trainer's, so "answered" is the least
    // misleading text.
    return 'answered';
  }
  if (status !== 409) {
    return null;
  }
  switch (code) {
    case 'booking-expired':
      return 'expired';
    case 'booking-withdrawn':
      return 'withdrawn';
    default:
      // `booking-not-pending`, and any other conflict the server may add later.
      return 'answered';
  }
}

/**
 * `submitting` to `unavailable` (409, 404) or `failed` (network error with status 0, 5xx, and
 * anything else, including a 403 the store could not resolve). Any other state is returned as
 * it is.
 */
export function resolveError(card: RequestCard, status: number, code?: string): RequestCard {
  if (card.state.kind !== 'submitting') {
    return card;
  }
  const reason = unavailableReason(status, code);
  if (reason) {
    return withState(card, { kind: 'unavailable', reason });
  }
  return withState(card, { kind: 'failed', action: card.state.action });
}

/** `idle` to `expired` when the clock reaches `expiresAt`. Any other state is returned as it is. */
export function expireCard(card: RequestCard): RequestCard {
  if (card.state.kind !== 'idle') {
    return card;
  }
  return withState(card, { kind: 'expired' });
}
