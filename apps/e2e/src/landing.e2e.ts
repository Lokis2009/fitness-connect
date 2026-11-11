import { expect, test } from '@playwright/test';
import type { AppUnderTest } from './apps';

test('the login landing page renders', async ({ page }, testInfo) => {
  const app = testInfo.project.metadata['app'] as AppUnderTest;

  await page.goto('/login');

  await expect(page.getByRole('heading', { level: 1, name: app.landingTitle })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});
