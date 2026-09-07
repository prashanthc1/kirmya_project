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
