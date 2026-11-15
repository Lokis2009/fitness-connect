import { hashPassword, type Role } from '@fitness-connect/common';
import { asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './client';
import {
  bookings,
  devCredentials,
  trainerProfiles,
  users,
  venues,
  type NewBookingRow,
} from './schema';

/** Password of every seeded account. Development only. */
export const DEV_PASSWORD = 'password';

export interface SeedUser {
  email: string;
  displayName: string;
  role: Role;
}

export const SEED_USERS: readonly SeedUser[] = [
  { email: 'client@example.com', displayName: 'Casey Client', role: 'client' },
  {
    email: 'trainer@example.com',
    displayName: 'Taylor Trainer',
    role: 'trainer',
  },
  {
    email: 'pat.pending@example.com',
    displayName: 'Pat Pending',
    role: 'trainer',
  },
  { email: 'admin@example.com', displayName: 'Alex Admin', role: 'admin' },
];

const TRAINER_EMAIL = 'trainer@example.com';
const PENDING_TRAINER_EMAIL = 'pat.pending@example.com';
const CLIENT_EMAIL = 'client@example.com';

const VENUE_TIME_ZONE = 'Europe/Warsaw';
const SESSION_MINUTES = 60;
const SESSION_PRICE_MINOR = 12000;
const SESSION_CURRENCY = 'PLN';
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** A request stays open for one hour after it is made. */
const REQUEST_WINDOW_MS = HOUR_MS;

function assertDevEnvironment(what: string): void {
  const nodeEnv = process.env['NODE_ENV'];
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    throw new Error(
      `Refusing to seed ${what}: NODE_ENV must be "development" or "test" (got "${nodeEnv ?? ''}")`,
    );
  }
}

/** Offset of `zone` from UTC at the instant `at`, in milliseconds. */
function zoneOffsetMs(zone: string, at: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(at));
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** The instant at which it is noon on the calendar day after `now` in `zone`. */
function tomorrowNoon(now: Date, zone: string): Date {
  const today = new Date(now.getTime() + zoneOffsetMs(zone, now.getTime()));
  const wallClock = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() + 1,
    12,
  );
  // The offset is read near the answer, so a daylight saving change in between is handled.
  const approximate = wallClock - zoneOffsetMs(zone, wallClock);
  return new Date(wallClock - zoneOffsetMs(zone, approximate));
}

/**
 * Inserts the data used for manual work on the trainer home: an `approved`
 * profile and a venue for `trainer@example.com`, a `submitted` profile for
 * `pat.pending@example.com`, and four bookings for the first trainer from
 * `client@example.com` (two pending, one confirmed session in progress, one
 * confirmed session tomorrow at noon in the venue zone), all relative to `now`.
 * Re-running restores profiles and venue and replaces the bookings of the two
 * seeded trainers, so their ids change. Needs {@link seedDevUsers} first.
 * Runs only when `NODE_ENV` is `development` or `test`, like {@link seedDevUsers}.
 */
export async function seedDevTrainerData(
  db: Database,
  now: Date,
): Promise<void> {
  assertDevEnvironment('development trainer data');

  await db.transaction(async (tx) => {
    const idsByEmail = new Map<string, string>();
    for (const row of await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        inArray(users.email, [
          TRAINER_EMAIL,
          PENDING_TRAINER_EMAIL,
          CLIENT_EMAIL,
        ]),
      )) {
      idsByEmail.set(row.email, row.id);
    }
    const idOf = (email: string): string => {
      const id = idsByEmail.get(email);
      if (!id) {
        throw new Error(
          `Cannot seed trainer data: user ${email} is missing, run seedDevUsers first`,
        );
      }
      return id;
    };
    const trainerId = idOf(TRAINER_EMAIL);
    const pendingTrainerId = idOf(PENDING_TRAINER_EMAIL);
    const clientId = idOf(CLIENT_EMAIL);

    const profiles = [
      { userId: trainerId, status: 'approved' },
      { userId: pendingTrainerId, status: 'submitted' },
    ] as const;
    for (const profile of profiles) {
      await tx
        .insert(trainerProfiles)
        .values({ ...profile, statusNote: null })
        .onConflictDoUpdate({
          target: trainerProfiles.userId,
          set: { status: profile.status, statusNote: null, updatedAt: now },
        });
    }

    // The bookings go first: they reference the venue and the history cascades.
    await tx
      .delete(bookings)
      .where(inArray(bookings.trainerUserId, [trainerId, pendingTrainerId]));

    const venueValues = {
      name: 'Iron Hall Gym',
      area: 'Powisle',
      address: '12 Example Street',
      instructions: 'Ring the bell at the gym entrance',
      timeZone: VENUE_TIME_ZONE,
    };
    const [existing] = await tx
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.trainerUserId, trainerId))
      .orderBy(asc(venues.createdAt))
      .limit(1);
    let venueId = existing?.id;
    if (venueId) {
      await tx.update(venues).set(venueValues).where(eq(venues.id, venueId));
    } else {
      [{ id: venueId }] = await tx
        .insert(venues)
        .values({ trainerUserId: trainerId, ...venueValues })
        .returning({ id: venues.id });
    }

    const at = (offsetMs: number) => new Date(now.getTime() + offsetMs);
    const base = {
      trainerUserId: trainerId,
      clientUserId: clientId,
      venueId,
      durationMinutes: SESSION_MINUTES,
      priceMinor: SESSION_PRICE_MINOR,
      currency: SESSION_CURRENCY,
    };
    const pending = (
      startsAt: Date,
      requestedMinutesAgo: number,
    ): NewBookingRow => {
      const requestedAt = at(-requestedMinutesAgo * MINUTE_MS);
      return {
        ...base,
        startsAt,
        status: 'pending',
        requestedAt,
        expiresAt: new Date(requestedAt.getTime() + REQUEST_WINDOW_MS),
      };
    };
    const confirmed = (startsAt: Date, requestedAt: Date): NewBookingRow => ({
      ...base,
      startsAt,
      status: 'confirmed',
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + REQUEST_WINDOW_MS),
      decidedAt: new Date(requestedAt.getTime() + 30 * MINUTE_MS),
    });

    await tx.insert(bookings).values([
      pending(at(5 * HOUR_MS), 5),
      pending(at(2 * HOUR_MS), 10),
      confirmed(at(-15 * MINUTE_MS), at(-DAY_MS)),
      confirmed(tomorrowNoon(now, VENUE_TIME_ZONE), at(-DAY_MS)),
    ]);
  });
}

/**
 * Inserts one user per role with the dev password. Idempotent: users are
 * matched by email and keep their id, and an existing password hash is kept.
 * Runs only when `NODE_ENV` is explicitly `development` or `test`, so an unset
 * or unexpected value never seeds the well-known password into a real database.
 */
export async function seedDevUsers(db: Database): Promise<void> {
  assertDevEnvironment('development users');

  await db.transaction(async (tx) => {
    for (const seed of SEED_USERS) {
      const [user] = await tx
        .insert(users)
        .values(seed)
        .onConflictDoUpdate({
          target: users.email,
          set: { displayName: seed.displayName, role: seed.role },
        })
        .returning({ id: users.id });

      await tx
        .insert(devCredentials)
        .values({
          userId: user.id,
          passwordHash: await hashPassword(DEV_PASSWORD),
        })
        .onConflictDoNothing();
    }
  });
}
