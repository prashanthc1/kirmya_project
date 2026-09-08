import { test, expect, Page, APIRequestContext, BrowserContext } from '@playwright/test';

/**
 * The acceptance criterion, driven through a real browser against the real API:
 * a signed-in user stays signed in across a reload, and no token is ever written
 * to localStorage or sessionStorage.
 *
 * These are the checks that would have caught the reported bug. The unit and
 * handler tests assert the cookie's attributes; only a browser can tell us
 * whether the browser agreed to store it.
 */

const PASSWORD = 'Disposable-CI-password-123!';

type Account = { email: string; id: string; token: string };

async function register(request: APIRequestContext, api: string, label: string): Promise<Account> {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `pw-session-${suffix}@example.invalid`;

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: { firstName: 'Session', lastName: label, email, password: PASSWORD, acceptTerms: true, acceptPrivacy: true },
  });
  expect(registration.status(), await registration.text()).toBe(201);

  const login = await request.post(`${api}/api/v1/auth/login`, { data: { email, password: PASSWORD } });
  expect(login.status()).toBe(200);
  const body = await login.json();

  return { email, id: (await registration.json()).user_id as string, token: body.accessToken || body.token };
}

/**
 * Signs in through the actual form, because that is the code path that sets the
 * cookie. Waits for the redirect rather than the login response: the form stores
 * the session and navigates on a short timer, and leaving earlier lands the next
 * page unauthenticated for reasons unrelated to persistence.
 */
async function signInThroughTheForm(page: Page, api: string, email: string) {
  await page.goto('/signin');

  // These pages hydrate by briefly mounting a second copy of the tree; filling
  // before that window closes types into the copy about to be discarded.
  const emailField = page.getByRole('textbox', { name: 'Email Address' });
  await expect(emailField).toHaveCount(1, { timeout: 15_000 });
  await expect(emailField).toBeVisible({ timeout: 15_000 });
  await emailField.fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  const signedIn = page.waitForResponse(
    (r) => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST'
  );
  await page.locator('button[type="submit"]').click();
  expect((await signedIn).status()).toBe(200);

  await expect(page).not.toHaveURL(/signin/, { timeout: 15_000 });
}

/** The refresh cookie the browser actually decided to keep. */
async function storedRefreshCookie(context: BrowserContext) {
  const cookies = await context.cookies();
  return cookies.find((c) => c.name === 'refresh_token');
}

/**
 * Waits for the app to finish restoring the session, by gating on an
 * authenticated /auth/me rather than on a timeout. A 200 here is the only proof
 * that the reload recovered a real identity.
 */
async function waitForRestoredSession(page: Page, api: string, navigate: () => Promise<unknown>) {
  const restored = page.waitForResponse(
    (r) =>
      r.url() === `${api}/api/v1/auth/me` && r.request().method() === 'GET' && r.status() === 200,
    { timeout: 25_000 }
  );
  await navigate();
  await restored;
}

test.describe('Session persistence across reloads', () => {
  test('a signed-in user stays signed in after a browser reload', async ({ page, context, request }) => {
    test.slow(); // two bcrypt-cost-12 operations plus several page loads
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const account = await register(request, api!, 'reload');
    await signInThroughTheForm(page, api!, account.email);

    // The cookie the whole mechanism depends on. A Secure cookie on a
    // plain-HTTP origin, or one the browser rejected for any other reason, is
    // simply absent here — and everything below would fail for a reason that
    // looks like an application bug.
    const cookie = await storedRefreshCookie(context);
    expect(cookie, 'the browser did not store the refresh cookie').toBeTruthy();
    expect(cookie!.httpOnly, 'the refresh cookie must be HttpOnly').toBe(true);
    expect(cookie!.path).toBe('/api/v1/auth');

    // The reload: in-memory access token is gone, only the cookie remains.
    await waitForRestoredSession(page, api!, () => page.reload());
    await expect(page).not.toHaveURL(/signin|login/);

    // A hard reload, bypassing any cache.
    await waitForRestoredSession(page, api!, () => page.goto(page.url(), { waitUntil: 'load' }));
    await expect(page).not.toHaveURL(/signin|login/);
  });

  test('no token is written to localStorage or sessionStorage', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'storage');

    await signInThroughTheForm(page, api, account.email);

    const stored = await page.evaluate(() => ({
      local: Object.entries({ ...localStorage }),
      session: Object.entries({ ...sessionStorage }),
    }));

    const asText = JSON.stringify(stored).toLowerCase();
    // A JWT is three base64url segments; any of them in web storage is the
    // failure this architecture exists to prevent.
    expect(asText, `web storage held a JWT: ${JSON.stringify(stored)}`).not.toMatch(/eyj[a-z0-9_-]+\./);
    for (const [key] of [...stored.local, ...stored.session]) {
      expect(key.toLowerCase()).not.toMatch(/token|jwt|refresh/);
    }
  });

  test('a direct protected URL is restored rather than bounced to sign-in', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'deeplink');

    await signInThroughTheForm(page, api, account.email);

    // Navigating straight to a protected route with no in-memory token is the
    // same problem as a reload, and the guard must wait for the bootstrap
    // instead of redirecting through it.
    await waitForRestoredSession(page, api, () => page.goto('/applications'));

    await expect(page).toHaveURL(/\/applications/);
    await expect(page).not.toHaveURL(/signin|login/);
  });

  test('a second tab shares the session without a fresh sign-in', async ({ page, context, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'newtab');

    await signInThroughTheForm(page, api, account.email);

    const secondTab = await context.newPage();
    try {
      await waitForRestoredSession(secondTab, api, () => secondTab.goto('/applications'));
      await expect(secondTab).not.toHaveURL(/signin|login/);
    } finally {
      await secondTab.close();
    }
  });

  test('reloading many times in a row does not sign the user out', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'repeat');

    await signInThroughTheForm(page, api, account.email);

    // The regression test for the rate limiter. /auth/refresh and /auth/me used
    // to share the credential endpoints' five-per-minute per-IP bucket, so the
    // third reload answered 429 and the app cleared the session. Six reloads is
    // twelve session requests — comfortably past the old ceiling.
    const throttled: string[] = [];
    page.on('response', (r) => {
      if (r.status() === 429 && r.url().startsWith(`${api}/api/v1/auth/`)) {
        throttled.push(r.url());
      }
    });

    for (let i = 0; i < 6; i += 1) {
      await waitForRestoredSession(page, api, () => page.reload());
      await expect(page, `signed out on reload ${i + 1}`).not.toHaveURL(/signin|login/);
    }

    expect(throttled, `session endpoints were rate limited: ${throttled.join(', ')}`).toEqual([]);
  });

  test('after signing out, a reload stays signed out', async ({ page, context, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'logout');

    await signInThroughTheForm(page, api, account.email);
    expect(await storedRefreshCookie(context)).toBeTruthy();

    const loggedOut = page.waitForResponse(
      (r) => r.url() === `${api}/api/v1/auth/logout` && r.request().method() === 'POST'
    );
    // The control lives in the header menu on desktop and the drawer on narrow
    // viewports; open whichever this project has before clicking.
    const menu = page.getByRole('button', { name: /account|profile|menu/i }).first();
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
    }
    await page.getByRole('menuitem', { name: /sign out|log out/i }).first().click();
    expect((await loggedOut).status()).toBe(200);

    // The cookie must be gone from the browser, not merely dead on the server.
    await expect
      .poll(async () => (await storedRefreshCookie(context)) ?? null, { timeout: 10_000 })
      .toBeNull();

    // And the reload must not resurrect anything.
    await page.goto('/applications');
    await expect(page).toHaveURL(/signin|login/, { timeout: 20_000 });
  });
});

test.describe('Credentialed CORS', () => {
  test('the API answers the web origin exactly, never with a wildcard', async ({ request }) => {
    const api = process.env.TEST_API_URL!;
    const origin = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    const response = await request.post(`${api}/api/v1/auth/refresh`, {
      headers: { Origin: origin },
      failOnStatusCode: false,
    });

    const allowOrigin = response.headers()['access-control-allow-origin'];
    const allowCredentials = response.headers()['access-control-allow-credentials'];

    // A wildcard alongside credentials is rejected outright by every browser,
    // which would make the refresh cookie unusable cross-origin.
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).toBe(origin);
    expect(allowCredentials).toBe('true');
  });

  test('an unknown origin gets no CORS grant and cannot write', async ({ request }) => {
    const api = process.env.TEST_API_URL!;

    const response = await request.post(`${api}/api/v1/auth/logout`, {
      headers: { Origin: 'https://attacker.example' },
      failOnStatusCode: false,
    });

    expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    // CORS alone would have let this run and merely hidden the response; the
    // origin guard refuses it outright.
    expect(response.status()).toBe(403);
  });
});
