// Entry point of `pnpm db:seed`: inserts the development users and the trainer
// home data (profiles, venue, bookings). Development only.
import type { Database } from '../lib/client';
import { seedDevTrainerData, seedDevUsers } from '../lib/seed';
import { runWithDatabase } from './run';

async function seed(db: Database): Promise<void> {
  await seedDevUsers(db);
  await seedDevTrainerData(db, new Date());
}

void runWithDatabase('db:seed', seed);
