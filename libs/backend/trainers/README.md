# trainers

Backend module for trainer data. Import path: `@fitness-connect/trainers`. Tags: `scope:api`, `type:api-lib`. It owns the `trainer_profiles` and `venues` tables, tells the `identity` module which approval status, admin note and venue time zone a trainer has (the three trainer fields on `GET /v1/me`), and provides `TrainerApprovedGuard`, which answers 403 `trainer-not-approved` unless the caller's status is `approved`. Other modules read trainer data only through its public API, such as `TrainersService.venuesByIds`, and never query its tables. It does not own bookings or users. Design: `docs/designs/trainer-home.md`.

## Running unit tests

Run `pnpm nx test trainers` to execute the unit tests via [Jest](https://jestjs.io).
