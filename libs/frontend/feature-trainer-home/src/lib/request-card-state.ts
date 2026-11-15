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

/** `idle` or `failed` to `submitting`, keeping the action. */
export function startSubmit(card: RequestCard, action: CardAction): RequestCard {
  void card;
  void action;
  throw new Error('not implemented');
}

/** `submitting` to `accepted` or `declined` on a 200. */
export function resolveSuccess(card: RequestCard, booking: Booking): RequestCard {
  void card;
  void booking;
  throw new Error('not implemented');
}

/** `submitting` to `unavailable` (409, 404) or `failed` (network error, 5xx). */
export function resolveError(card: RequestCard, status: number, code?: string): RequestCard {
  void card;
  void status;
  void code;
  throw new Error('not implemented');
}

/** `idle` to `expired` when the clock reaches `expiresAt`. */
export function expireCard(card: RequestCard): RequestCard {
  void card;
  throw new Error('not implemented');
}
