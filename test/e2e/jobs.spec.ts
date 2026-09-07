import { test, expect } from '@playwright/test';
import { settled } from './helpers';

// /jobs is a public route backed by the public GET /api/v1/jobs endpoint
// (backend/internal/jobs/delivery/http/routes.go registers it with no auth
// middleware). This used to assert an empty board on the grounds that the CI
// database is migrated but never seeded. That stopped being true once the
// batch 3 journey started publishing a real job: the four browser projects
// share one database and run in order, so every project after the first sees
// that posting. The invariant that actually matters is asserted instead — the
// page reaches the API and renders a real result, empty or not, never the
// error state.

test.describe('Job Search & Discovery Flow', () => {
  test('Job board loads from the real API and renders a real result', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const listing = page.waitForResponse(
      // Match the board listing itself. A prefix match also catches the
      // authenticated siblings the page requests (saved jobs, recommendations),
      // and whichever resolved first decided the assertion, so an anonymous 401
      // could be read as the board having failed.
      (r) => new URL(r.url()).pathname === '/api/v1/jobs' && r.request().method() === 'GET'
    );
    await page.goto('/jobs');

    await settled(page.getByRole('heading', { name: 'Explore Opportunities', level: 1 }));
    expect((await listing).status()).toBe(200);

    // An error state here would mean the frontend could not reach the API at
    // all. Either the empty state or at least one posting is a real result; the
    // board must land on one of them.
    await expect(page.getByRole('heading', { name: 'Unable to load job postings' })).toHaveCount(0);
    const emptyState = page.getByRole('heading', { name: 'No open roles found' });
    const postingCount = page.getByText(/Showing \d+ open roles?/);
    await expect
      .poll(async () => (await emptyState.count()) + (await postingCount.count()), {
        message: 'the board rendered neither the empty state nor a posting count',
      })
      .toBeGreaterThan(0);
  });

  test('Search filters push their criteria into the URL', async ({ page }) => {
    await page.goto('/jobs');
    await settled(page.getByRole('heading', { name: 'Explore Opportunities', level: 1 }));

    await page.getByLabel('Search jobs by title or keyword').fill('backend engineer');
    await page.getByLabel('Filter by location').fill('Remote');
    await page.getByRole('button', { name: 'Find Jobs' }).click();

    await expect(page).toHaveURL(/[?&]q=backend\+engineer/);
    await expect(page).toHaveURL(/[?&]location=Remote/);
    await expect(page.getByText('Keyword: backend engineer')).toBeVisible();
  });
});
