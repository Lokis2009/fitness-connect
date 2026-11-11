import { defineConfig, devices } from '@playwright/test';
import { APPS } from './src/apps';
import { API_ENV, API_PORT } from './src/stack';

const reuseExistingServer = !process.env['CI'];

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.ts',
  globalSetup: './src/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  projects: APPS.map((app) => ({
    name: app.name,
    metadata: { app },
    use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${app.port}` },
  })),
  webServer: [
    {
      command: 'pnpm nx serve api',
      cwd: '../..',
      url: `http://localhost:${API_PORT}/v1/health`,
      env: API_ENV,
      reuseExistingServer,
      timeout: 180_000,
    },
    ...APPS.map((app) => ({
      command: `pnpm nx serve ${app.name}`,
      cwd: '../..',
      // main.js only exists once the first build has finished; the index page answers earlier.
      url: `http://localhost:${app.port}/main.js`,
      reuseExistingServer,
      timeout: 180_000,
    })),
  ],
});
