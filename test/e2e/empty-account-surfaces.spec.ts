import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * The pages a brand-new account sees first, in a real browser against the real
 * API.
 *
 * The reported defect was the network dashboard failing to render at all:
 * `Cannot read properties of null (reading 'length')` on `connections.length`,
 * because GET /api/v1/network/connections answered `null` rather than `[]` for
 * an account with no connections yet. Sixty-three endpoints across twenty-two
 * modules had the same shape, so the account these tests create - which has no
 * connections, no notifications, no communities and no endorsements - is
 * exactly the case that used to break.
 *
 * The assertion is deliberately about crashes, not content: each page must
 * render its own heading, and the browser must report no uncaught exception
 * while it does. An empty account legitimately shows empty lists.
 *
 * This covers the rendered page, which two layers now protect - the API answers
 * with an array, and the networking client coerces a non-array payload. The API
 * contract itself is asserted separately, for 55 endpoints, by
 * TestListEndpointsAnswerWithArrays in backend/test/ci/batch5_domains_test.go.
 */

const PASSWORD = 'Disposable-CI-password-123!';

/*
 * A request the browser cancelled is not an exception the page threw.
 *
 * Next.js prefetches every destination in the global navigation as soon as the
 * page reached after signing in hydrates - one RSC request per <Link>, each
 * carrying a `?_rsc=` query - and the `page.goto` below cancels whichever of
 * them are still open. Chromium and Firefox report that as a failed request and
 * nothing more. WebKit also raises it on the page, as an uncaught "Fetch API
 * cannot load <url> ... due to access control checks.", which arrives here
 * through `pageerror`.
 *
 * That is how this file went red on WebKit: on whichever surface happened to
 * navigate while prefetches were still in flight - /network and /communities in
 * one run, neither in the next, both passing on retry. The page had not changed
 * and neither had this spec; the test was being shown its own navigation.
 *
 * Only a message naming an RSC prefetch is set aside, and only the Next.js
 * router builds those URLs - no application code constructs a `?_rsc=` request,
 * so nothing the product can throw matches this. The defect this file exists
 * for, `Cannot read properties of null (reading 'length')` on an account with
 * no connections, carries no URL at all and still fails the assertion below.
 */
function isCancelledPrefetch(message: string): boolean {
  return message.includes('?_rsc=');
}

async function registerAccount(request: APIRequestContext, api: string): Promise<string> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `pw-empty-${suffix}@example.invalid`;

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      firstName: 'Empty',
      lastName: 'Account',
      email,
      password: PASSWORD,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  expect(registration.status(), await registration.text()).toBe(201);
  return email;
}

async function signIn(page: Page, api: string, email: string) {
  await page.goto('/signin');

  // These pages hydrate by mounting a second copy of the tree briefly; filling
  // before that window closes types into the copy about to be discarded.
  const emailField = page.getByRole('textbox', { name: 'Email Address' });
  await expect(emailField).toHaveCount(1, { timeout: 15_000 });
  await expect(emailField).toBeVisible({ timeout: 15_000 });
  await emailField.fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  const signedIn = page.waitForResponse(
    (r) => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Sign In' }).click();
  expect((await signedIn).status()).toBe(200);
  await expect(page).not.toHaveURL(/signin/, { timeout: 15_000 });
}

test.describe('A brand-new account can open the pages it lands on', () => {
  const surfaces = [
    { path: '/network', heading: /professional network/i },
    { path: '/notifications', heading: /notification/i },
    { path: '/communities', heading: /communit/i },
    { path: '/endorsements', heading: /endorsement/i },
  ];

  for (const surface of surfaces) {
    test(`${surface.path} renders for an account with no data`, async ({ page, request }) => {
      const api = process.env.TEST_API_URL;
      expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

      const crashes: string[] = [];
      page.on('pageerror', (error) => {
        if (!isCancelledPrefetch(error.message)) crashes.push(error.message);
      });

      const email = await registerAccount(request, api!);
      await signIn(page, api!, email);

      await page.goto(surface.path);
      await expect(page.getByRole('heading', { name: surface.heading }).first()).toBeVisible({
        timeout: 20_000,
      });

      // `connections.length` on a null threw here before the list endpoints
      // were made to answer with arrays.
      expect(crashes, `uncaught exceptions on ${surface.path}`).toEqual([]);
    });
  }
});
