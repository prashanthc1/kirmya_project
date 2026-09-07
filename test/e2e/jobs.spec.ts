import { test, expect } from '@playwright/test';

// /jobs is a public route backed by the public GET /api/v1/jobs endpoint
// (backend/internal/jobs/delivery/http/routes.go registers it with no auth
// middleware). The CI database is migrated but never seeded, so the board is
// empty and the page must land on its empty state rather than an error.

test.describe('Job Search & Discovery Flow', () => {
  test('Job board loads from the real API and reports an empty board', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const listing = page.waitForResponse(
      (r) => r.url().startsWith(`${api}/api/v1/jobs`) && r.request().method() === 'GET'
    );
    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Explore Opportunities', level: 1 })).toBeVisible();
    expect((await listing).status()).toBe(200);

    // The migrated-but-unseeded CI database has no postings; an error state here
    // would mean the frontend could not reach the API at all.
    await expect(page.getByRole('heading', { name: 'No open roles found' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unable to load job postings' })).toHaveCount(0);
  });

  test('Search filters push their criteria into the URL', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: 'Explore Opportunities', level: 1 })).toBeVisible();

    await page.getByLabel('Search jobs by title or keyword').fill('backend engineer');
    await page.getByLabel('Filter by location').fill('Remote');
    await page.getByRole('button', { name: 'Find Jobs' }).click();

    await expect(page).toHaveURL(/[?&]q=backend\+engineer/);
    await expect(page).toHaveURL(/[?&]location=Remote/);
    await expect(page.getByText('Keyword: backend engineer')).toBeVisible();
  });
});
