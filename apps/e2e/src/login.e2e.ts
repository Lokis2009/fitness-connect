import { expect, test, type Page } from '@playwright/test';
import { DEV_PASSWORD, type AppUnderTest } from './apps';

let app: AppUnderTest;

// Playwright requires the first argument to use object destructuring, even when empty.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
  app = testInfo.project.metadata['app'] as AppUnderTest;
});

const signInButton = (page: Page) => page.getByRole('button', { name: 'Sign in', exact: true });

async function submitDevForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await signInButton(page).click();
}

async function startFromLandingPage(page: Page): Promise<void> {
  await page.goto('/login');
  await signInButton(page).click();
  await expect(page).toHaveURL(/\/dev-login/);
}

test('an unauthenticated visit to the home page redirects to the login page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login\?returnUrl=%2F$/);
  await expect(page.getByRole('heading', { level: 1, name: app.landingTitle })).toBeVisible();
});

test('signing in with the seeded account shows the signed-in home page', async ({ page }) => {
  await startFromLandingPage(page);
  await submitDevForm(page, app.account.email, DEV_PASSWORD);

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.homeHeading);
  await expect(page.getByText(app.account.email)).toBeVisible();
});

test('the session survives a page reload', async ({ page }) => {
  await startFromLandingPage(page);
  await submitDevForm(page, app.account.email, DEV_PASSWORD);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.homeHeading);

  await page.reload();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.homeHeading);
});

test('a wrong password shows an error and keeps the form', async ({ page }) => {
  await startFromLandingPage(page);
  await submitDevForm(page, app.account.email, 'not-the-password');

  await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  await expect(page).toHaveURL(/\/dev-login/);
});

test('an account with another role is rejected and stays signed out', async ({ page }) => {
  await startFromLandingPage(page);
  await submitDevForm(page, app.otherRoleAccount.email, DEV_PASSWORD);

  await expect(page.getByRole('alert')).toContainText(
    `This account cannot sign in to the ${app.role} app`,
  );
  await expect(page).toHaveURL(/\/dev-login/);

  await page.goto('/');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2F$/);
});

test('an empty form shows validation errors', async ({ page }) => {
  await startFromLandingPage(page);
  await signInButton(page).click();

  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
});

test('signing out returns to the login page and protects the home page', async ({ page }) => {
  await startFromLandingPage(page);
  await submitDevForm(page, app.account.email, DEV_PASSWORD);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.homeHeading);

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page).toHaveURL(/\/login/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2F$/);
});

test('a returnUrl pointing to another site is ignored after signing in', async ({
  page,
  baseURL,
}) => {
  await page.goto('/dev-login?returnUrl=%2F%2Fexample.org%2Fphish');
  await submitDevForm(page, app.account.email, DEV_PASSWORD);

  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.homeHeading);
});
