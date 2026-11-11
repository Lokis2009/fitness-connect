import { expect, test } from '@playwright/test';

test('headings, labels, inputs and buttons use the same font family', async ({ page }) => {
  await page.goto('/dev-login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const families = await page.evaluate(() => {
    const family = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).fontFamily : 'missing';
    };
    return {
      heading: family('h1'),
      label: family('label'),
      input: family('input'),
      button: family('button'),
    };
  });

  expect(families.label).toBe(families.heading);
  expect(families.input).toBe(families.heading);
  expect(families.button).toBe(families.heading);
});
