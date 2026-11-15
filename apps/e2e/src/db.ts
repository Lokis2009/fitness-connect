export interface BookingOptions {
  /** Display name of the client who made the request. Each test uses its own, so cards are told apart. */
  clientName: string;
  startsAt: Date;
  /** Defaults to 60. */
  durationMinutes?: number;
  /** A pending request is open for the next 55 minutes. Defaults to `pending`. */
  status?: 'pending' | 'confirmed';
}

/** Inserts a booking for the seeded approved trainer and its venue, and returns the booking id. */
export async function createBooking(options: BookingOptions): Promise<string> {
  void options;
  throw new Error('not implemented');
}

/** Moves the deadline of a pending request into the past, as if the hour had run out. */
export async function expireBooking(id: string): Promise<void> {
  void id;
  throw new Error('not implemented');
}
