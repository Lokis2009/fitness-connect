# API

NestJS modular monolith. Global prefix `/v1`, port `API_PORT` (default 3000). The HTTP contract is
`libs/shared/api-contract` (OpenAPI is the source of truth; errors are RFC 9457 `application/problem+json`).

Phase 1 endpoints: `GET /v1/health` (public), `GET /v1/me` (token), `POST /v1/dev/login` (development only).

## Layout

| Project | Path | Contents |
|---------|------|----------|
| `api` | `apps/api` | App bootstrap, module wiring, `GET /health` |
| `common` | `libs/backend/common` | Env validation, problem-details filter, validation pipe and CORS setup (`configureApp`), JWT guard with a pluggable `TokenVerifier`, `@Roles()` and roles guard, password hashing |
| `database` | `libs/backend/database` | Drizzle schema, SQL migrations, seed, `DatabaseModule`, test database helpers |
| `identity` | `libs/backend/identity` | `GET /me`, dev login, dev HS256 verifier, users repository |

## Environment

Copy `.env.example` to `.env` (gitignored). Nx loads it for every task. The API validates the environment
at startup and exits with a list of all problems.

| Variable | Notes |
|----------|-------|
| `NODE_ENV` | Required, no default: `development`, `test` or `production` |
| `API_PORT` | 1 to 65535, default 3000 |
| `CORS_ORIGINS` | Comma separated allow-list, default none |
| `DATABASE_URL` | Required, `postgres://` URL |
| `JWT_DEV_SECRET` | Required unless `NODE_ENV=production`, at least 32 characters; must not be set in production |

## Run

To start the API together with the three web apps, use `pnpm dev:all` (see the root `README.md`). To run the API
alone:

```sh
docker compose up -d --wait   # or: pnpm dev:infra (Postgres + PostGIS, Redis)
cp .env.example .env
pnpm db:migrate               # applies libs/backend/database/migrations (first one enables PostGIS)
pnpm db:seed                  # dev only, idempotent
pnpm nx serve api
```

`pnpm db:generate` runs `drizzle-kit generate` after you change `libs/backend/database/src/lib/schema`;
commit the generated SQL. `db:seed` runs only when `NODE_ENV` is `development` or `test`.

### Seeded users

| Email | Role |
|-------|------|
| `client@example.com` | client |
| `trainer@example.com` | trainer |
| `admin@example.com` | admin |

The password of all three is `password`. It lives in the `dev_credentials` table (kept out of `users`)
as a salted scrypt hash, format `scrypt$N$r$p$salt$hash` (base64url salt and hash), see
`libs/backend/common/src/lib/security/password-hash.ts`.

### Try it

```sh
curl localhost:3000/v1/health
curl -X POST localhost:3000/v1/dev/login -H 'content-type: application/json' \
  -d '{"email":"trainer@example.com","password":"password"}'
curl localhost:3000/v1/me -H "authorization: Bearer <accessToken>"
```

Dev tokens are HS256 JWTs signed with `JWT_DEV_SECRET`, claims `sub` (user id), `role`, `email`,
issuer `fitness-connect-dev`, valid for one hour. The dev module (login route and verifier) is only
registered when `NODE_ENV` is not `production`; in production every protected route answers 401 until
a Cognito verifier is added behind the same `TokenVerifier` interface.

## Test

```sh
pnpm nx test api --coverage     # also: common, database, identity
```

Jest, with an 80% coverage gate per project. Integration tests run the real app against a real Postgres:
they create and migrate `fitness_connect_test` (api) and `fitness_connect_test_<project>` on the server in
`DATABASE_URL` (default `localhost:5432` with the compose credentials) and never touch the dev database.
The contract test bundles the OpenAPI file with the Redocly CLI and checks real responses against it.

## Notes on TypeScript 6 and ESM

- TypeScript 6 no longer loads `@types/*` implicitly. Every backend `tsconfig.json` sets `"types": ["node"]`,
  otherwise `jest.config.cts` fails to compile ("Cannot find name 'module'").
- `jose` is ESM only. Jest compiles it to CommonJS (`transformIgnorePatterns` plus `allowJs` in
  `tsconfig.spec.json`, for `identity` and `api`). At runtime the webpack build requires it as an external,
  which needs Node 20.19+ or 22.12+ (`require(esm)`).
- `drizzle-kit` loads the schema without tsconfig path aliases, so `schema/users.ts` only imports types from
  workspace libs. `db:migrate` and `db:seed` run through `@swc-node/register` with `tsconfig.base.json`.
