import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEV_PASSWORD, type AppUnderTest } from './apps';
import { createBooking, expireBooking } from './db';

const VENUE_NAME = 'Iron Hall Gym';
const VENUE_TIME_ZONE = 'Europe/Warsaw';
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

let app: AppUnderTest;

// Playwright requires the first argument to use object destructuring, even when empty.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
  app = testInfo.project.metadata['app'] as AppUnderTest;
  test.skip(app.name !== 'trainer-web', 'The trainer home exists only in the trainer app');
});

/** A name no other test uses, so a card can be found by its client. */
function uniqueClientName(label: string): string {
  return `${label} ${randomUUID().slice(0, 8)}`;
}

function offsetMs(zone: string, at: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(at));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** Noon on the calendar day after today in the venue zone. Noon is never inside a DST gap. */
function tomorrowNoon(zone: string): Date {
  const local = new Date(Date.now() + offsetMs(zone, Date.now()));
  const wallClock = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + 1,
    12,
  );
  // The offset is read near the answer, so a DST change between now and then is handled.
  const approximate = wallClock - offsetMs(zone, wallClock);
  return new Date(wallClock - offsetMs(zone, approximate));
}

/** A session that is in progress whenever the test runs: it started 5 minutes ago and lasts 60. */
function inProgressStart(): Date {
  return new Date(Date.now() - 5 * MINUTE_MS);
}

/** A request for a session far enough away to stay out of the late window. */
function laterToday(): Date {
  return new Date(Date.now() + 5 * HOUR_MS);
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dev-login/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(DEV_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function openHome(page: Page): Promise<void> {
  await signIn(page, app.account.email);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainer home');
}

/** The request card or session row that shows this client. */
function cardOf(page: Page, clientName: string): Locator {
  return page.locator('fc-card', { hasText: clientName });
}

test('an approved trainer sees pending requests and the sessions of today and tomorrow', async ({
  page,
}) => {
  const pendingClient = uniqueClientName('Pending');
  const todayClient = uniqueClientName('Today');
  const tomorrowClient = uniqueClientName('Tomorrow');
  await createBooking({ clientName: pendingClient, startsAt: laterToday() });
  await createBooking({
    clientName: todayClient,
    startsAt: inProgressStart(),
    status: 'confirmed',
  });
  await createBooking({
    clientName: tomorrowClient,
    startsAt: tomorrowNoon(VENUE_TIME_ZONE),
    status: 'confirmed',
  });

  await openHome(page);

  await expect(page.getByText('Times are shown in Warsaw time.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /^Booking requests/ })).toBeVisible();
  const request = cardOf(page, pendingClient);
  await expect(request.getByRole('heading', { level: 3, name: pendingClient })).toBeVisible();
  await expect(request).toContainText('120 PLN');
  await expect(request).toContainText(VENUE_NAME);
  await expect(request).toContainText('Respond by');
  await expect(request.getByRole('button', { name: 'Accept' })).toBeEnabled();
  await expect(request.getByRole('button', { name: 'Decline' })).toBeEnabled();

  await expect(page.getByRole('heading', { level: 2, name: 'Today and tomorrow' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: /^Today,/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: /^Tomorrow,/ })).toBeVisible();
  await expect(cardOf(page, todayClient)).toContainText(VENUE_NAME);
  await expect(cardOf(page, tomorrowClient)).toContainText('12:00');
  await expect(cardOf(page, tomorrowClient)).toContainText('Warsaw time');
});

test('accepting a request confirms it and moves it to the sessions', async ({ page }) => {
  const client = uniqueClientName('Accept');
  await createBooking({ clientName: client, startsAt: tomorrowNoon(VENUE_TIME_ZONE) });
  await openHome(page);
  const card = cardOf(page, client);

  await card.getByRole('button', { name: 'Accept' }).click();

  await expect(card.getByText('Accepted', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Accept' })).toHaveCount(0);

  // The new session shows without a reload: the accepted card and the session row both name the client.
  await expect(cardOf(page, client)).toHaveCount(2);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainer home');
  await expect(page.getByRole('heading', { level: 3, name: /^Tomorrow,/ })).toBeVisible();
  const session = cardOf(page, client);
  await expect(session).toHaveCount(1);
  await expect(session).toContainText('12:00');
  await expect(session.getByRole('button', { name: 'Accept' })).toHaveCount(0);
});

test('declining a request removes it without a reason', async ({ page }) => {
  const client = uniqueClientName('Decline');
  await createBooking({ clientName: client, startsAt: laterToday() });
  await openHome(page);
  const card = cardOf(page, client);

  await card.getByRole('button', { name: 'Decline' }).click();

  await expect(card.getByText('Declined', { exact: true })).toBeVisible();
  await expect(card).toContainText('No reason was sent');

  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainer home');
  await expect(cardOf(page, client)).toHaveCount(0);
});

test('a request that expired before the tap shows as no longer available', async ({ page }) => {
  const client = uniqueClientName('Race');
  const id = await createBooking({ clientName: client, startsAt: laterToday() });
  await openHome(page);
  const card = cardOf(page, client);
  await expect(card.getByRole('button', { name: 'Accept' })).toBeEnabled();

  await expireBooking(id);
  await card.getByRole('button', { name: 'Accept' }).click();

  await expect(card.getByText('No longer available', { exact: true })).toBeVisible();
  await expect(card).toContainText('This request expired before you answered.');
  await expect(card.getByRole('button', { name: 'Accept' })).toHaveCount(0);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainer home');
  await expect(cardOf(page, client)).toHaveCount(0);
});

test('the email link while signed out signs in and highlights the request', async ({ page }) => {
  const client = uniqueClientName('Link');
  const id = await createBooking({ clientName: client, startsAt: laterToday() });

  await page.goto(`/?request=${id}`);

  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email').fill(app.account.email);
  await page.getByLabel('Password', { exact: true }).fill(DEV_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page).toHaveURL(`/?request=${id}`);
  const card = cardOf(page, client);
  await expect(card.getByText('Opened from email', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Accept' })).toBeEnabled();
});

test('a link to a request that is not pending shows a notice', async ({ page }) => {
  const client = uniqueClientName('Dead link');
  const id = await createBooking({ clientName: client, startsAt: laterToday() });
  await expireBooking(id);
  await signIn(page, app.account.email);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainer home');

  await page.goto(`/?request=${id}`);

  await expect(page.getByText('That request is no longer available.')).toBeVisible();
  await expect(cardOf(page, client)).toHaveCount(0);
});

test('a trainer who is not approved lands on the setup page', async ({ page }) => {
  const pending = app.unapprovedTrainer;
  expect(pending).toBeDefined();

  await signIn(page, pending!.email);

  await expect(page).toHaveURL('/setup');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your profile is under review');

  await page.goto('/');

  await expect(page).toHaveURL('/setup');
});
