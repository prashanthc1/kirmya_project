import { test, expect } from '@playwright/test';
import { settled } from './helpers';

// GET /api/v1/profile/me is registered under AuthRequired
// (backend/internal/profile/delivery/http/routes.go). The page has no route
// guard, so the honest anonymous outcome is the real 401 followed by the
// error state from frontend/src/app/profile/page.tsx.

test.describe('User Profile Flow', () => {
  test('Anonymous profile load is refused and the page says so', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const profile = page.waitForResponse(
      (r) => r.url() === `${api}/api/v1/profile/me` && r.request().method() === 'GET'
    );
    await page.goto('/profile');

    expect((await profile).status()).toBe(401);

    await settled(page.getByRole('heading', { name: 'Unable to load profile' }));
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('Profile editor route is reachable and distinct from the read view', async ({ page }) => {
    await page.goto('/profile/edit');
    await expect(page).toHaveURL(/\/profile\/edit$/);
    // A 404 would render Next.js's not-found page instead of the app shell.
    await expect(page.getByText('404')).toHaveCount(0);
  });
});
