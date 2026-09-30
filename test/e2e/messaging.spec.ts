import { test, expect } from '@playwright/test';
import { DISPOSABLE_PASSWORD, signIn } from './helpers';

// /messaging is a redirect stub (frontend/src/app/messaging/page.tsx) onto
// /messages. The conversation endpoints sit behind AuthRequired
// (backend/internal/messaging/delivery/http/routes.go).
//
// These used to assert that an anonymous visitor reached /messages, watched the
// API answer 401, and was shown an empty conversation list. That was an honest
// description of a page with no route guard — which is what every "authenticated"
// page was, because AuthenticatedLayout wrapped AppShell and AppShell had no auth
// logic at all. The guard is now wired into AuthenticatedLayout, so the anonymous
// outcome is a redirect to sign in and no request for anyone else's data.

test.describe('Messaging Shell & Anonymous Access', () => {
  test('Legacy /messaging path redirects to /messages', async ({ page }) => {
    await page.goto('/messaging');
    // The alias still resolves; the guard then takes an anonymous visitor on to
    // the login page, so both destinations are acceptable here. What must not
    // happen is landing on /messaging itself.
    await expect(page).toHaveURL(/\/(messages|signin|login)/);
  });

  // Messaging is hidden for now (frontend/src/shared/features.ts): the inbox
  // answers not-found for everyone, before the sign-in guard is reached. The
  // API is unchanged and still refuses an anonymous caller on its own.
  test('The inbox answers not-found while messaging is hidden', async ({ page }) => {
    const response = await page.goto('/messages');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /couldn.t find that page/i })).toBeVisible();
  });

  test('The conversations endpoint refuses an anonymous caller', async ({ request }) => {
    const api = process.env.TEST_API_URL!;

    // The guard is a convenience for the visitor, never the security boundary.
    // The API must refuse the same request on its own.
    const response = await request.get(`${api}/api/v1/messages/conversations`, {
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(401);
  });

  test('The inbox stays hidden once signed in', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const email = `pw-messaging-${Date.now()}-${Math.random().toString(16).slice(2)}@example.invalid`;

    const registration = await request.post(`${api}/api/v1/auth/register`, {
      data: { firstName: 'Inbox', lastName: 'Reader', email, password: DISPOSABLE_PASSWORD, acceptTerms: true, acceptPrivacy: true },
    });
    expect(registration.status()).toBe(201);
    await signIn(page, api, email);

    const response = await page.goto('/messages');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /couldn.t find that page/i })).toBeVisible();
  });
});
