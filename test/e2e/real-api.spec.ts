import { test, expect } from '@playwright/test';

test('built signin page makes a real API request and anonymous identity is denied', async ({ page, request }) => {
  const api = process.env.TEST_API_URL;
  expect(api, 'TEST_API_URL is mandatory').toBeTruthy();
  const anonymous = await request.get(`${api}/api/v1/auth/me`);
  expect(anonymous.status()).toBe(401);
  await page.goto('/signin');
  const email = page.getByRole('textbox', { name: 'Email Address' });
  const password = page.getByLabel('Password', { exact: true });
  await expect(email).toBeVisible();
  await email.fill('absent-ci-user@example.invalid');
  await password.fill('Disposable-CI-password-123!');
  const response = page.waitForResponse(r => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST');
  await page.locator('button[type="submit"]').click();
  expect((await response).status()).toBe(401);
  await expect(page).toHaveURL(/signin/);
});

// Batch 2, step 5: the production build must address the API through one base.
//
// NEXT_PUBLIC_API_URL already includes /api/v1, but the telemetry and web-vitals
// callers appended their own, producing /api/v1/api/v1/telemetry/... — a 404 on
// every client error report from a real deployment. This asserts the shape of
// every API request the built page actually issues rather than reading the
// source, so a caller that re-derives the base wrongly fails here.
test('the production build issues no doubled /api/v1 requests', async ({ page }) => {
  const api = process.env.TEST_API_URL;
  expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

  const apiRequests: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith(`${api}/`)) {
      apiRequests.push(url);
    }
  });

  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
  // Give any deferred telemetry or vitals reporter a chance to fire.
  await page.waitForTimeout(1500);

  const doubled = apiRequests.filter((u) => u.includes('/api/v1/api/v1/'));
  expect(doubled, `requests with a doubled API prefix: ${doubled.join(', ')}`).toEqual([]);

  // Anything addressed at the API host must sit under the versioned prefix.
  const offBase = apiRequests.filter((u) => !u.startsWith(`${api}/api/v1/`));
  expect(offBase, `API-host requests outside /api/v1: ${offBase.join(', ')}`).toEqual([]);
});

// The built bundle must not ship the synthetic bearer that several feature
// clients used to send in place of the signed-in user's token.
test('the production bundle carries no synthetic bearer identity', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    const type = response.headers()['content-type'] || '';
    if (type.includes('javascript')) {
      try {
        scripts.push(await response.text());
      } catch {
        // A script that cannot be read back is not evidence either way.
      }
    }
  });

  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
  await page.waitForTimeout(1000);

  const offending = scripts.filter((body) => body.includes('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d'));
  expect(offending.length, 'a served script still embeds the synthetic bearer UUID').toBe(0);
});
