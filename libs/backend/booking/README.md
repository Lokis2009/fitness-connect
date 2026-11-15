# booking

Backend module for scheduled bookings. Import path: `@fitness-connect/booking`. Tags: `scope:api`, `type:api-lib`. For now it serves the trainer's side: the list of pending booking requests, the list of confirmed sessions in a time range, and accept and decline, which run in one transaction and write a status history row. It queries only the `bookings` and `booking_status_changes` tables. Client names come from `identity` (`UsersService.displayNames`) and venues from `trainers` (`TrainersService.venuesByIds`), merged in memory. It does not create bookings; the client request flow will. Design: `docs/designs/trainer-home.md`.

## Running unit tests

Run `pnpm nx test booking` to execute the unit tests via [Jest](https://jestjs.io).
