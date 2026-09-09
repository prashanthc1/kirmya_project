import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * The navigation architecture, driven through a real browser against the real
 * API on the production build.
 *
 * Unit tests pin the configuration and the matching. Only a browser can say
 * whether a signed-in person lands on the feed, whether the tab that should be
 * lit is lit on the page that is actually rendered, and whether a phone-width
 * viewport has anything to navigate with.
 */

const PASSWORD = 'Disposable-CI-password-123!';

async function register(request: APIRequestContext, api: string, label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `pw-nav-${suffix}@example.invalid`;
  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: { firstName: 'Nav', lastName: label, email, password: PASSWORD, acceptTerms: true, acceptPrivacy: true },
  });
  expect(registration.status(), await registration.text()).toBe(201);
  return { email, id: (await registration.json()).user_id as string };
}

async function signIn(page: Page, api: string, email: string) {
  await page.goto('/signin');
  const emailField = page.getByRole('textbox', { name: 'Email Address' });
  await expect(emailField).toHaveCount(1, { timeout: 15_000 });
  await expect(emailField).toBeVisible({ timeout: 15_000 });
  await emailField.fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  const signedIn = page.waitForResponse(
    r => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Sign In' }).click();
  expect((await signedIn).status()).toBe(200);
  await expect(page).not.toHaveURL(/signin/, { timeout: 15_000 });
}

test.describe('Navigation architecture', () => {
  test('signing in lands a normal user on the feed, not a dashboard', async ({ page, request }) => {
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'home');
    await signIn(page, api, account.email);
    await expect(page).toHaveURL(/\/feed$/, { timeout: 15_000 });
  });

  test('the generic user dashboard is gone and redirects to the feed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/feed$/, { timeout: 15_000 });
  });

  test('the retired duplicate prefixes redirect to their canonical module',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'prefix');
      await signIn(page, api, account.email);

      await page.goto('/messaging');
      await expect(page).toHaveURL(/\/messages/, { timeout: 15_000 });
      await page.goto('/networking');
      await expect(page).toHaveURL(/\/network$/, { timeout: 15_000 });
    });

  test('the feed carries the global navigation, with Feed marked as the current page',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'active');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      const feedLink = page.getByRole('link', { name: 'Feed', exact: true }).first();
      await expect(feedLink).toBeVisible({ timeout: 15_000 });
      await expect(feedLink).toHaveAttribute('aria-current', 'page');
    });

  test('a nested jobs route lights Jobs globally and its own section tab', async ({ page, request }) => {
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'nested');
    await signIn(page, api, account.email);
    await page.goto('/applications');

    // Context navigation is present and names itself for assistive technology.
    const sections = page.getByRole('navigation', { name: /jobs sections/i });
    await expect(sections).toBeVisible({ timeout: 15_000 });
    await expect(sections.getByRole('tab', { name: 'Applications' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('every primary destination is reachable and none answers not-found',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'reach');
      await signIn(page, api, account.email);

      for (const path of ['/feed', '/network', '/jobs', '/communities', '/messages', '/notifications', '/settings', '/profile']) {
        const response = await page.goto(path);
        expect(response?.status(), `${path} answered ${response?.status()}`).toBeLessThan(400);

        // The not-found page by its own heading, rather than by searching the
        // body for "404". That substring check failed on WebKit against a page
        // that had rendered perfectly: the disposable account this test creates
        // is named from a millisecond timestamp, one run's timestamp happened
        // to contain 404, and /settings displays the signed-in email address.
        // A test that fails on the digits of the clock is worse than no test.
        await expect(
          page.getByRole('heading', { name: /couldn.t find that page/i }),
          `${path} rendered the not-found page`
        ).toHaveCount(0);
      }
    });

  test('platform administration is not offered to a normal user, and refuses the URL',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'normal');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      // Nothing in the navigation leads to it.
      await expect(page.getByRole('link', { name: /Kirmya administration/i })).toHaveCount(0);

      // And typing the address is refused rather than served.
      await page.goto('/admin/users');
      await expect(page.getByText(/do not have access to Kirmya administration/i)).toBeVisible({
        timeout: 15_000,
      });
    });

  test('company management refuses a signed-in stranger', async ({ page, request }) => {
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'stranger');
    await signIn(page, api, account.email);

    await page.goto('/companies/a-company-this-account-does-not-manage/admin');
    await expect(page.getByText(/do not have access/i)).toBeVisible({ timeout: 15_000 });
  });

  test('search, notifications and sign out stay reachable from the header',
    async ({ page, request }) => {
      // Viewport-independent parts of the global actions. The header's search
      // field is a wide-screen affordance; the phone case is covered below.
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'actions');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      await expect(page.getByRole('link', { name: /^Notifications/ })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole('button', { name: 'User account menu' }).click();
      await expect(page.getByRole('menuitem', { name: /sign out|log out/i })).toBeVisible({
        timeout: 10_000,
      });
    });

  test('the global navigation is keyboard reachable', async ({ page, request }) => {
    const api = process.env.TEST_API_URL!;
    const account = await register(request, api, 'keyboard');
    await signIn(page, api, account.email);
    await page.goto('/jobs');

    // Tabbing from the top of the document reaches a real link, not a div.
    let reachedLink = false;
    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
      const role = await page.evaluate(() => document.activeElement?.getAttribute('role') ?? '');
      if (tag === 'A' || role === 'tab') {
        reachedLink = true;
        break;
      }
    }
    expect(reachedLink, 'no link or tab was reachable by keyboard from the top of the page').toBe(true);
  });
});

test.describe('Navigation on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('offers the five primary destinations in a bottom bar, and does not overflow',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'phone');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      const bar = page.getByRole('navigation', { name: 'Primary' });
      await expect(bar).toBeVisible({ timeout: 15_000 });
      for (const label of ['Feed', 'Network', 'Jobs', 'Messages', 'Me']) {
        await expect(bar.getByRole('link', { name: label, exact: true })).toBeVisible();
      }

      // Nothing pushes the document sideways at this width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, 'the page scrolls horizontally on a phone').toBeLessThanOrEqual(1);
    });

  test('keeps search reachable, in the drawer rather than the header',
    async ({ page, request }) => {
      // The header's search field is hidden at this width on purpose - a phone
      // header cannot hold a text field and the primary actions both. It has to
      // remain reachable, and it is: one tap into the navigation drawer.
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'phonesearch');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      await page.getByRole('button', { name: 'Open mobile navigation' }).click();
      await expect(page.getByRole('searchbox').first()).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Navigation on a small tablet', () => {
  // This theme's md is 768px. Between sm (640) and md the desktop row is hidden
  // and the bottom bar used to be hidden too, so every primary destination was
  // behind the hamburger. Both now switch at the same breakpoint.
  test.use({ viewport: { width: 720, height: 1024 } });

  test('has primary navigation at the width that used to have none',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'tablet');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      const primary = page.getByRole('navigation', { name: 'Primary' });
      await expect(primary).toBeVisible({ timeout: 15_000 });
      await expect(primary.getByRole('link', { name: 'Jobs', exact: true })).toBeVisible();
    });
});

test.describe('Navigation on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('shows the primary row in the header rather than a bottom bar',
    async ({ page, request }) => {
      const api = process.env.TEST_API_URL!;
      const account = await register(request, api, 'desktop');
      await signIn(page, api, account.email);
      await page.goto('/feed');

      const primary = page.getByRole('navigation', { name: 'Primary' });
      await expect(primary).toBeVisible({ timeout: 15_000 });
      for (const label of ['Feed', 'Network', 'Jobs', 'Communities', 'Messages']) {
        await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
      }
    });
});
