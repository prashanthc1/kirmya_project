import { test, expect } from '@playwright/test';

// GET /api/v1/profile/me is registered under AuthRequired
// (backend/internal/profile/delivery/http/routes.go).
//
// This used to assert the anonymous outcome as "a real 401 followed by an error
// state", which was honest about a page that had no route guard — as every
// "authenticated" page did, because AuthenticatedLayout wrapped AppShell and
// AppShell had no auth logic. The guard now lives in AuthenticatedLayout, so an
// anonymous visitor is sent to sign in and no profile request is made at all.

test.describe('User Profile Flow', () => {
  test('An anonymous visitor is sent to sign in rather than shown an error page', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    // Note what this does not claim. The page still issues its own
    // GET /api/v1/profile/me: each page calls its API from a useEffect in the
    // page component, and <AuthenticatedLayout> sits inside that component's
    // JSX rather than around it, so the fetch is already in flight when the
    // guard renders. Suppressing it would mean moving the guard into the
    // Next.js layouts, which is a larger change than this one. The request is
    // refused by the API — asserted directly below — so it leaks nothing; it is
    // wasted work and a 401 in the console, not an exposure.
  });

  test('The profile endpoint refuses an anonymous caller', async ({ request }) => {
    const api = process.env.TEST_API_URL!;

    // The redirect is a convenience for the visitor; the API is the boundary.
    const response = await request.get(`${api}/api/v1/profile/me`, { failOnStatusCode: false });
    expect(response.status()).toBe(401);
  });

  test('Profile editor route is reachable and distinct from the read view', async ({ page }) => {
    await page.goto('/profile/edit');
    await expect(page).toHaveURL(/\/profile\/edit$/);
    // A 404 would render Next.js's not-found page instead of the app shell.
    await expect(page.getByText('404')).toHaveCount(0);
  });
});
