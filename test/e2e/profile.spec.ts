import { test, expect } from '@playwright/test';

import { registerAccount, signIn } from './helpers';

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

  /*
   * Signed in, deliberately.
   *
   * This navigated anonymously and asserted the URL stayed on /profile/edit,
   * which the product does not do: ProfileEditLayout renders inside
   * <AuthenticatedLayout>, the same guard the first test in this file asserts
   * for /profile. The two tests contradicted each other, and this one could
   * only pass by winning a race - toHaveURL checks immediately, so it passed
   * whenever the auth bootstrap had not yet resolved to 'unauthenticated' and
   * fired the redirect.
   *
   * It went red on Firefox when the redirect happened to land first. Nothing
   * about the page had changed; the commit that surfaced it touched no frontend
   * file at all. A test that passes because a redirect was slow is not testing
   * the route, so it now signs in and asserts what it was actually for: the
   * editor route exists, is not a 404, and is a different page from the read
   * view.
   */
  test('Profile editor route is reachable and distinct from the read view', async ({ request, page }) => {
    const api = process.env.TEST_API_URL!;
    const account = await registerAccount(request, api, 'profile-editor');
    await signIn(page, api, account.email);

    await page.goto('/profile/edit');
    await expect(page).toHaveURL(/\/profile\/edit$/);
    // A 404 would render Next.js's not-found page instead of the app shell.
    await expect(page.getByText('404')).toHaveCount(0);
    // And it is the editor, not the read view rendered at a second URL.
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  /*
   * The other half, now that the case above is signed in: the editor is guarded
   * like every other authenticated page. This is the assertion the old test
   * accidentally inverted.
   */
  test('The profile editor sends an anonymous visitor to sign in', async ({ page }) => {
    await page.goto('/profile/edit');
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});
