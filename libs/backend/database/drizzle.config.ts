import { defineConfig } from 'drizzle-kit';

// Used by `pnpm db:generate`. Migrations are applied by `pnpm db:migrate`
// (src/cli/migrate.ts), so no database credentials are needed here.
export default defineConfig({
  dialect: 'postgresql',
  schema: './libs/backend/database/src/lib/schema/index.ts',
  out: './libs/backend/database/migrations',
});
