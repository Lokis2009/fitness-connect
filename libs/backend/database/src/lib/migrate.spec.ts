import { getTableConfig } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { createDatabase, type DatabaseHandle } from './client';
import { runMigrations } from './migrate';
import {
  bookings,
  bookingStatusChanges,
  trainerProfiles,
  venues,
} from './schema';
import { ensureTestDatabase } from './testing';

const NAME = 'fitness_connect_test_database_migrate';

describe('runMigrations', () => {
  let handle: DatabaseHandle;
  let pool: Pool;

  beforeAll(async () => {
    const url = await ensureTestDatabase(NAME, { recreate: true });
    handle = createDatabase(url);
    pool = handle.pool;
    await runMigrations(handle.db);
  });

  afterAll(async () => {
    await handle.pool.end();
  });

  const rows = async (sql: string, params: unknown[] = []) =>
    (await pool.query(sql, params)).rows;

  it('enables the postgis extension first', async () => {
    await expect(
      rows("select extname from pg_extension where extname = 'postgis'"),
    ).resolves.toEqual([{ extname: 'postgis' }]);
    await expect(rows('select postgis_version() as v')).resolves.toHaveLength(
      1,
    );
  });

  it('creates users with the planned columns', async () => {
    const columns = await rows(
      `select column_name, data_type, is_nullable, column_default
         from information_schema.columns
        where table_name = 'users' order by column_name`,
    );

    expect(
      columns.map((c) => [c.column_name, c.data_type, c.is_nullable]),
    ).toEqual([
      ['cognito_sub', 'text', 'YES'],
      ['created_at', 'timestamp with time zone', 'NO'],
      ['display_name', 'text', 'NO'],
      ['email', 'text', 'NO'],
      ['id', 'uuid', 'NO'],
      ['role', 'USER-DEFINED', 'NO'],
    ]);
    const byName = Object.fromEntries(
      columns.map((c) => [c.column_name, c.column_default]),
    );
    expect(byName.id).toContain('gen_random_uuid()');
    expect(byName.created_at).toContain('now()');
  });

  it('limits role to client, trainer and admin', async () => {
    await expect(
      rows(`select unnest(enum_range(null::user_role))::text as role`),
    ).resolves.toEqual([
      { role: 'client' },
      { role: 'trainer' },
      { role: 'admin' },
    ]);
    await expect(
      pool.query(
        "insert into users (email, display_name, role) values ('x@example.com', 'X', 'superuser')",
      ),
    ).rejects.toThrow(/user_role/);
  });

  it('keeps emails and cognito subs unique', async () => {
    await pool.query(
      "insert into users (email, display_name, role, cognito_sub) values ('dup@example.com', 'A', 'client', 'sub-1')",
    );

    await expect(
      pool.query(
        "insert into users (email, display_name, role) values ('dup@example.com', 'B', 'client')",
      ),
    ).rejects.toThrow(/users_email_unique/);
    await expect(
      pool.query(
        "insert into users (email, display_name, role, cognito_sub) values ('other@example.com', 'C', 'client', 'sub-1')",
      ),
    ).rejects.toThrow(/users_cognito_sub_unique/);
  });

  it('stores dev credentials per user and removes them with the user', async () => {
    const [{ id }] = await rows(
      "insert into users (email, display_name, role) values ('cred@example.com', 'D', 'trainer') returning id",
    );
    await pool.query(
      'insert into dev_credentials (user_id, password_hash) values ($1, $2)',
      [id, 'scrypt$x'],
    );
    await expect(
      pool.query(
        'insert into dev_credentials (user_id, password_hash) values ($1, $2)',
        [id, 'scrypt$y'],
      ),
    ).rejects.toThrow(/dev_credentials_pkey/);

    await pool.query('delete from users where id = $1', [id]);

    await expect(
      rows('select * from dev_credentials where user_id = $1', [id]),
    ).resolves.toEqual([]);
  });

  describe('trainer home tables', () => {
    const columnsOf = async (table: string) =>
      (
        await rows(
          `select column_name, data_type, is_nullable, column_default, character_maximum_length
             from information_schema.columns
            where table_schema = 'public' and table_name = $1
            order by column_name`,
          [table],
        )
      ).map((c) => ({
        name: c.column_name as string,
        type: c.data_type as string,
        nullable: c.is_nullable === 'YES',
        default: c.column_default as string | null,
        length: c.character_maximum_length as number | null,
      }));

    const columnOf = (
      cols: Awaited<ReturnType<typeof columnsOf>>,
      name: string,
    ) => {
      const column = cols.find((c) => c.name === name);
      if (!column) throw new Error(`missing column ${name}`);
      return column;
    };

    const shape = (cols: Awaited<ReturnType<typeof columnsOf>>) =>
      cols.map((c) => [c.name, c.type, c.nullable]);

    const insertUser = async (email: string, role = 'client') => {
      const [{ id }] = await rows(
        'insert into users (email, display_name, role) values ($1, $1, $2) returning id',
        [email, role],
      );
      return id as string;
    };

    const insertVenue = async (trainerId: string) => {
      const [{ id }] = await rows(
        `insert into venues (trainer_user_id, name, area, address, time_zone)
         values ($1, 'Gym', 'Area', '1 Street', 'Europe/Warsaw') returning id`,
        [trainerId],
      );
      return id as string;
    };

    const insertBooking = async (
      trainerId: string,
      clientId: string,
      venueId: string,
      overrides: {
        durationMinutes?: number;
        priceMinor?: number;
        expiresOffset?: string;
      } = {},
    ) => {
      const [{ id }] = await rows(
        `insert into bookings
           (trainer_user_id, client_user_id, venue_id, starts_at, duration_minutes,
            price_minor, currency, requested_at, expires_at)
         values ($1, $2, $3, now() + interval '5 hours', $4, $5, 'PLN', now(),
                 now() + $6::interval)
         returning id`,
        [
          trainerId,
          clientId,
          venueId,
          overrides.durationMinutes ?? 60,
          overrides.priceMinor ?? 12000,
          overrides.expiresOffset ?? '1 hour',
        ],
      );
      return id as string;
    };

    it('creates trainer_profiles with the planned columns', async () => {
      const columns = await columnsOf('trainer_profiles');

      expect(shape(columns)).toEqual([
        ['created_at', 'timestamp with time zone', false],
        ['status', 'USER-DEFINED', false],
        ['status_note', 'text', true],
        ['updated_at', 'timestamp with time zone', false],
        ['user_id', 'uuid', false],
      ]);
      expect(columnOf(columns, 'status').default).toContain('incomplete');
      expect(columnOf(columns, 'created_at').default).toContain('now()');
      expect(columnOf(columns, 'updated_at').default).toContain('now()');
    });

    it('creates venues with the planned columns and index', async () => {
      const columns = await columnsOf('venues');

      expect(shape(columns)).toEqual([
        ['address', 'text', false],
        ['area', 'text', false],
        ['created_at', 'timestamp with time zone', false],
        ['id', 'uuid', false],
        ['instructions', 'text', true],
        ['name', 'text', false],
        ['time_zone', 'text', false],
        ['trainer_user_id', 'uuid', false],
      ]);
      await expect(
        rows(
          `select indexdef from pg_indexes
            where tablename = 'venues' and indexname = 'venues_trainer_user_id_idx'`,
        ),
      ).resolves.toEqual([
        expect.objectContaining({
          indexdef: expect.stringContaining('(trainer_user_id)'),
        }),
      ]);
    });

    it('creates bookings with the planned columns', async () => {
      const columns = await columnsOf('bookings');

      expect(shape(columns)).toEqual([
        ['client_user_id', 'uuid', false],
        ['created_at', 'timestamp with time zone', false],
        ['currency', 'character', false],
        ['decided_at', 'timestamp with time zone', true],
        ['duration_minutes', 'integer', false],
        ['expires_at', 'timestamp with time zone', false],
        ['id', 'uuid', false],
        ['price_minor', 'integer', false],
        ['requested_at', 'timestamp with time zone', false],
        ['starts_at', 'timestamp with time zone', false],
        ['status', 'USER-DEFINED', false],
        ['trainer_user_id', 'uuid', false],
        ['venue_id', 'uuid', false],
      ]);
      expect(columnOf(columns, 'currency').length).toBe(3);
      expect(columnOf(columns, 'status').default).toContain('pending');
    });

    it('creates booking_status_changes with the planned columns and index', async () => {
      const columns = await columnsOf('booking_status_changes');

      expect(shape(columns)).toEqual([
        ['booking_id', 'uuid', false],
        ['changed_at', 'timestamp with time zone', false],
        ['from_status', 'USER-DEFINED', true],
        ['id', 'uuid', false],
        ['to_status', 'USER-DEFINED', false],
      ]);
      await expect(
        rows(
          `select indexdef from pg_indexes
            where tablename = 'booking_status_changes'
              and indexname = 'booking_status_changes_booking_id_idx'`,
        ),
      ).resolves.toEqual([
        expect.objectContaining({
          indexdef: expect.stringContaining('(booking_id)'),
        }),
      ]);
    });

    it('limits trainer_status and booking_status to the planned values', async () => {
      await expect(
        rows(`select unnest(enum_range(null::trainer_status))::text as v`),
      ).resolves.toEqual([
        { v: 'incomplete' },
        { v: 'submitted' },
        { v: 'changes_requested' },
        { v: 'approved' },
      ]);
      await expect(
        rows(`select unnest(enum_range(null::booking_status))::text as v`),
      ).resolves.toEqual([
        { v: 'pending' },
        { v: 'confirmed' },
        { v: 'declined' },
        { v: 'expired' },
        { v: 'withdrawn' },
        { v: 'cancelled' },
        { v: 'completed' },
      ]);
    });

    it('indexes bookings by trainer, status and deadline or start, and by client', async () => {
      const indexes = await rows(
        `select indexname, indexdef from pg_indexes
          where tablename = 'bookings' and indexname <> 'bookings_pkey'
          order by indexname`,
      );

      expect(indexes.map((i) => i.indexname)).toEqual([
        'bookings_client_status_idx',
        'bookings_trainer_status_expires_idx',
        'bookings_trainer_status_starts_idx',
      ]);
      const defs = Object.fromEntries(
        indexes.map((i) => [i.indexname, i.indexdef as string]),
      );
      expect(defs.bookings_client_status_idx).toContain(
        '(client_user_id, status)',
      );
      expect(defs.bookings_trainer_status_expires_idx).toContain(
        '(trainer_user_id, status, expires_at)',
      );
      expect(defs.bookings_trainer_status_starts_idx).toContain(
        '(trainer_user_id, status, starts_at)',
      );
    });

    it('defaults a trainer profile to incomplete', async () => {
      const trainer = await insertUser(
        'profile-default@example.com',
        'trainer',
      );

      await expect(
        rows(
          'insert into trainer_profiles (user_id) values ($1) returning status, status_note',
          [trainer],
        ),
      ).resolves.toEqual([{ status: 'incomplete', status_note: null }]);
    });

    describe('check constraints on bookings', () => {
      let trainer: string;
      let client: string;
      let venue: string;

      beforeAll(async () => {
        trainer = await insertUser('check-trainer@example.com', 'trainer');
        client = await insertUser('check-client@example.com');
        venue = await insertVenue(trainer);
      });

      it('accepts a valid booking with the pending default', async () => {
        const id = await insertBooking(trainer, client, venue);

        await expect(
          rows('select status from bookings where id = $1', [id]),
        ).resolves.toEqual([{ status: 'pending' }]);
      });

      it('rejects a zero or negative duration', async () => {
        await expect(
          insertBooking(trainer, client, venue, { durationMinutes: 0 }),
        ).rejects.toThrow(/bookings_duration_minutes_positive/);
      });

      it('rejects a negative price but allows a free session', async () => {
        await expect(
          insertBooking(trainer, client, venue, { priceMinor: -1 }),
        ).rejects.toThrow(/bookings_price_minor_non_negative/);
        await expect(
          insertBooking(trainer, client, venue, { priceMinor: 0 }),
        ).resolves.toEqual(expect.any(String));
      });

      it('rejects a deadline that is not after the request time', async () => {
        await expect(
          insertBooking(trainer, client, venue, { expiresOffset: '0 seconds' }),
        ).rejects.toThrow(/bookings_expires_after_requested/);
        await expect(
          insertBooking(trainer, client, venue, { expiresOffset: '-1 minute' }),
        ).rejects.toThrow(/bookings_expires_after_requested/);
      });
    });

    describe('deletes', () => {
      it('removes the profile and venues with the trainer', async () => {
        const trainer = await insertUser(
          'cascade-trainer@example.com',
          'trainer',
        );
        await pool.query('insert into trainer_profiles (user_id) values ($1)', [
          trainer,
        ]);
        await insertVenue(trainer);

        await pool.query('delete from users where id = $1', [trainer]);

        await expect(
          rows('select 1 from trainer_profiles where user_id = $1', [trainer]),
        ).resolves.toEqual([]);
        await expect(
          rows('select 1 from venues where trainer_user_id = $1', [trainer]),
        ).resolves.toEqual([]);
      });

      it('removes the status history with the booking', async () => {
        const trainer = await insertUser('hist-trainer@example.com', 'trainer');
        const client = await insertUser('hist-client@example.com');
        const venue = await insertVenue(trainer);
        const booking = await insertBooking(trainer, client, venue);
        await pool.query(
          `insert into booking_status_changes (booking_id, from_status, to_status)
           values ($1, null, 'pending'), ($1, 'pending', 'confirmed')`,
          [booking],
        );

        await pool.query('delete from bookings where id = $1', [booking]);

        await expect(
          rows('select 1 from booking_status_changes where booking_id = $1', [
            booking,
          ]),
        ).resolves.toEqual([]);
      });

      it('keeps bookings from losing their trainer, client or venue', async () => {
        const trainer = await insertUser('keep-trainer@example.com', 'trainer');
        const client = await insertUser('keep-client@example.com');
        const venue = await insertVenue(trainer);
        await insertBooking(trainer, client, venue);

        await expect(
          pool.query('delete from users where id = $1', [client]),
        ).rejects.toThrow(/bookings_client_user_id_users_id_fk/);
        await expect(
          pool.query('delete from users where id = $1', [trainer]),
        ).rejects.toThrow(/violates foreign key constraint/);
        await expect(
          pool.query('delete from venues where id = $1', [venue]),
        ).rejects.toThrow(/bookings_venue_id_venues_id_fk/);
      });
    });
  });

  it('declares the trainer home foreign keys in the schema', () => {
    const references = (table: Parameters<typeof getTableConfig>[0]) =>
      getTableConfig(table)
        .foreignKeys.map((fk) => {
          const ref = fk.reference();
          return [
            ref.columns.map((c) => c.name).join(),
            getTableConfig(ref.foreignTable).name,
            fk.onDelete ?? 'no action',
          ];
        })
        .sort();

    expect(references(trainerProfiles)).toEqual([
      ['user_id', 'users', 'cascade'],
    ]);
    expect(references(venues)).toEqual([
      ['trainer_user_id', 'users', 'cascade'],
    ]);
    expect(references(bookings)).toEqual([
      ['client_user_id', 'users', 'no action'],
      ['trainer_user_id', 'users', 'no action'],
      ['venue_id', 'venues', 'no action'],
    ]);
    expect(references(bookingStatusChanges)).toEqual([
      ['booking_id', 'bookings', 'cascade'],
    ]);
  });

  it('can run again without changes', async () => {
    await expect(runMigrations(handle.db)).resolves.toBeUndefined();
  });
});
