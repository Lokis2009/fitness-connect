# admin

Backend module for admin-only reads. Import path: `@fitness-connect/admin`. Tags: `scope:api`, `type:api-lib`. It serves `GET /v1/admin/users`, a paged list of users with an optional role filter, for callers with the `admin` role. It reads users only through the public `UsersRepository` of the `identity` module and never queries tables itself.

## Running unit tests

Run `pnpm nx test admin` to execute the unit tests via [Jest](https://jestjs.io).
