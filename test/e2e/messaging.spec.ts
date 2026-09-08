import { test, expect } from '@playwright/test';

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
    await expect(page).toHaveURL(/\/(messages|login)/);
  });

  test('An anonymous visitor is sent to sign in rather than shown the inbox', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    await page.goto('/messages');

    // The inbox is never rendered for a signed-out visitor. The page's own
    // useEffect still fires its conversation request — the guard sits inside the
    // page component rather than around it — and the API refuses that request,
    // which is asserted separately below.
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
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

  test('The inbox is reachable once signed in', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const password = 'Disposable-CI-password-123!';
    const email = `pw-messaging-${Date.now()}-${Math.random().toString(16).slice(2)}@example.invalid`;

    const registration = await request.post(`${api}/api/v1/auth/register`, {
      data: { firstName: 'Inbox', lastName: 'Reader', email, password, acceptTerms: true, acceptPrivacy: true },
    });
    expect(registration.status()).toBe(201);

    await page.goto('/signin');
    const emailField = page.getByRole('textbox', { name: 'Email Address' });
    await expect(emailField).toHaveCount(1, { timeout: 15_000 });
    await emailField.fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const signedIn = page.waitForResponse(
      (r) => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    expect((await signedIn).status()).toBe(200);
    await expect(page).not.toHaveURL(/signin/, { timeout: 15_000 });

    // The point of this test: the guard admits an authenticated visitor. It
    // asserts the absence of a redirect rather than any particular heading,
    // because what is being verified is the guard's decision, not the inbox's
    // markup.
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/messages/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/login/);
  });
});
