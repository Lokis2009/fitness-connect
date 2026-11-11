// Entry point of `pnpm db:migrate`: applies the committed SQL migrations.
import { runMigrations } from '../lib/migrate';
import { runWithDatabase } from './run';

void runWithDatabase('db:migrate', runMigrations);
