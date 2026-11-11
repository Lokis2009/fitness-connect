# Fitness Connect

Nx monorepo (pnpm): a NestJS API and three Angular web apps (client, trainer, admin) sharing a UI library.
Architecture decisions are in [`Architecture.md`](Architecture.md).

## Local development

Prerequisites: Node 20.19+ or 22.12+ (`nvm use` picks the version from `.nvmrc`), pnpm, Docker. Older Node
versions make Nx fail with "Failed to process project graph".

```sh
pnpm install
pnpm dev:all
```

`pnpm dev:all` runs `tools/dev/start-all.sh`, which:

1. creates `.env` from `.env.example` if it does not exist,
2. starts Postgres (PostGIS) and Redis with `pnpm dev:infra`,
3. applies database migrations with `pnpm db:migrate`,
4. serves all four parts in dev mode through Nx (`nx run-many -t serve`):

| Part | Project | URL |
|------|---------|-----|
| API | `api` | http://localhost:3000 (prefix `/v1`, health at `/v1/health`) |
| Client app | `client-web` | http://localhost:4200 |
| Trainer app | `trainer-web` | http://localhost:4201 |
| Admin app | `admin-web` | http://localhost:4202 |

The web apps proxy `/api` to the API (see `tools/dev/proxy.conf.cjs`). Press Ctrl+C to stop the four servers;
Postgres and Redis keep running until you run `pnpm dev:infra:down`.

Options: `pnpm dev:all --no-infra` skips starting Docker (use it when Postgres and Redis already run),
`--no-migrate` skips migrations.

The script does not seed data. For the dev users (`client@example.com`, `trainer@example.com`,
`admin@example.com`, password `password`) run `pnpm db:seed` once; it is idempotent. Details in
[`apps/api/README.md`](apps/api/README.md).

### Other scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev:infra` / `pnpm dev:infra:down` | Start / stop Postgres and Redis |
| `pnpm db:generate`, `db:migrate`, `db:seed` | Drizzle migrations and dev seed |
| `pnpm mock:api` | Prism mock of the OpenAPI contract on port 4010 (use with `API_MOCK=true pnpm nx serve client-web`) |
| `pnpm contract:lint`, `contract:types` | Lint the OpenAPI file, regenerate its TypeScript types |

Run a single part with `pnpm nx serve <project>`; tests with `pnpm nx test <project>`; end-to-end tests with
`pnpm nx e2e e2e`.
