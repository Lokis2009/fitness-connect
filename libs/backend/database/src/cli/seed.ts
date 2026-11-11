// Entry point of `pnpm db:seed`: inserts the development users. Development only.
import { seedDevUsers } from '../lib/seed';
import { runWithDatabase } from './run';

void runWithDatabase('db:seed', seedDevUsers);
