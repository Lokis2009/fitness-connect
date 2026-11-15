import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { E2E_DATABASE_URL } from './stack';

const TRAINER_EMAIL = 'trainer@example.com';
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export interface BookingOptions {
  /** Display name of the client who made the request. Each test uses its own, so cards are told apart. */
  clientName: string;
  startsAt: Date;
  /** Defaults to 60. */
  durationMinutes?: number;
  /** A pending request is open for the next 55 minutes. Defaults to `pending`. */
  status?: 'pending' | 'confirmed';
}

async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/**
 * Inserts a booking for the seeded approved trainer and its venue, and returns the booking id.
 * The client is a new user, so tests never share a client and accepting one request cannot
 * withdraw the request of another test.
 */
export async function createBooking(options: BookingOptions): Promise<string> {
  const { clientName, startsAt, durationMinutes = 60, status = 'pending' } = options;
  const now = Date.now();
  // A pending request was made 5 minutes ago and expires 1 hour after that. A confirmed one was
  // requested a day ago and answered 30 minutes later.
  const requestedAt = new Date(status === 'pending' ? now - 5 * MINUTE_MS : now - DAY_MS);
  const expiresAt = new Date(requestedAt.getTime() + HOUR_MS);
  const decidedAt = status === 'confirmed' ? new Date(requestedAt.getTime() + 30 * MINUTE_MS) : null;

  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const trainer = await client.query<{ id: string; venue_id: string }>(
        `SELECT u.id, v.id AS venue_id
           FROM users u
           JOIN venues v ON v.trainer_user_id = u.id
          WHERE u.email = $1
          ORDER BY v.created_at
          LIMIT 1`,
        [TRAINER_EMAIL],
      );
      if (trainer.rowCount === 0) {
        throw new Error(`No venue for ${TRAINER_EMAIL}: run the database seed first`);
      }
      const clientUser = await client.query<{ id: string }>(
        `INSERT INTO users (email, display_name, role)
         VALUES ($1, $2, 'client')
         RETURNING id`,
        [`e2e-${randomUUID()}@example.com`, clientName],
      );
      const booking = await client.query<{ id: string }>(
        `INSERT INTO bookings (
           trainer_user_id, client_user_id, venue_id, starts_at, duration_minutes,
           price_minor, currency, status, requested_at, expires_at, decided_at
         ) VALUES ($1, $2, $3, $4, $5, 12000, 'PLN', $6, $7, $8, $9)
         RETURNING id`,
        [
          trainer.rows[0].id,
          clientUser.rows[0].id,
          trainer.rows[0].venue_id,
          startsAt,
          durationMinutes,
          status,
          requestedAt,
          expiresAt,
          decidedAt,
        ],
      );
      await client.query(
        `INSERT INTO booking_status_changes (booking_id, from_status, to_status)
         VALUES ($1, NULL, 'pending')`,
        [booking.rows[0].id],
      );
      await client.query('COMMIT');
      return booking.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

/** Moves the deadline of a pending request into the past, as if the hour had run out. */
export async function expireBooking(id: string): Promise<void> {
  await withClient(async (client) => {
    const result = await client.query(
      `UPDATE bookings
          SET requested_at = now() - interval '2 hours',
              expires_at = now() - interval '1 minute'
        WHERE id = $1 AND status = 'pending'`,
      [id],
    );
    if (result.rowCount !== 1) {
      throw new Error(`Booking ${id} is not a pending request`);
    }
  });
}
