import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { ADMIN_DATABASE_URL, API_ENV, E2E_DATABASE_NAME, E2E_DATABASE_URL } from './stack';

async function ensureDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_DATABASE_URL });
  await admin.connect();
  try {
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      E2E_DATABASE_NAME,
    ]);
    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${E2E_DATABASE_NAME}`);
    }
  } finally {
    await admin.end();
  }
}

function runDatabaseTask(task: 'migrate' | 'seed'): void {
  const result = spawnSync('pnpm', ['nx', 'run', `database:${task}`], {
    cwd: resolve(__dirname, '../../..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      // db:seed refuses to run unless NODE_ENV is development or test.
      NODE_ENV: API_ENV['NODE_ENV'],
      DATABASE_URL: E2E_DATABASE_URL,
      NX_DAEMON: 'false',
    },
  });
  if (result.status !== 0) {
    throw new Error(`database:${task} failed against ${E2E_DATABASE_NAME}`);
  }
}

export default async function globalSetup(): Promise<void> {
  await ensureDatabase();
  runDatabaseTask('migrate');
  runDatabaseTask('seed');
}
