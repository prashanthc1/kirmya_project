import { test, expect } from '@playwright/test';
import { becomeRecruiter, registerAccount } from './helpers';

/*
 * The workspace switcher against the real API and the production build.
 *
 * The unit tests drive the component with a mocked list; these prove the whole
 * path - the server resolving workspaces from real capability, the bootstrap
 * carrying them, and the control rendering what arrived. A switcher that works
 * against a fixture and not against /auth/me would be worse than none.
 */

const password = 'Disposable-CI-password-123!';

async function signIn(page: import('@playwright/test').Page, email: string) {
  await page.goto('/signin');
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/feed/, { timeout: 15_000 });
}

/**
 * The switcher's trigger, wherever this viewport keeps it.
 *
 * On desktop it sits beside the account controls in the header. On a phone the
 * header has no room for it, so it lives in the drawer's account block and
 * opens from the account control there - the presentation the architecture
 * asks for. A test that only knew about the desktop position would pass on
 * three engines and fail on the phone, which is exactly what it did.
 */
async function switcherTrigger(page: import('@playwright/test').Page) {
  const trigger = page.getByRole('button', { name: /change workspace|current workspace/i });
  const drawerButton = page.getByRole('button', { name: /open mobile navigation/i });

  // Wait for the shell to settle before deciding which position this viewport
  // uses. Asking too early answers "neither", which is how this first went
  // wrong after a Back navigation.
  await expect(trigger.or(drawerButton).first()).toBeVisible({ timeout: 15_000 });

  if (await trigger.isVisible().catch(() => false)) return trigger;
  await drawerButton.click();
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  return trigger;
}

test('an account with one workspace is offered no switcher', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-single');

  await signIn(page, account.email);

  // A control that cannot switch is a control that does nothing - at either
  // position, so the drawer is opened first where this viewport has one before
  // concluding the switcher is absent. Visibility is checked rather than the
  // click being attempted blind: clicking a hidden element waits out the whole
  // timeout, which fails the test for the wrong reason.
  const drawerButton = page.getByRole('button', { name: /open mobile navigation/i });
  if (await drawerButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await drawerButton.click();
  }
  await expect(page.getByRole('button', { name: /change workspace/i })).toHaveCount(0);
});

test('completing recruiter onboarding puts Recruiting in the switcher', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-recruit');
  await becomeRecruiter(request, api, account);

  await signIn(page, account.email);

  const trigger = await switcherTrigger(page);
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAccessibleName(/current workspace: professional/i);

  await trigger.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: /professional/i })).toHaveAttribute('href', '/feed');
  await expect(menu.getByRole('menuitem', { name: /recruiting/i })).toHaveAttribute('href', '/recruiter');
});

test('switching enters the workspace, and the control follows the URL', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-switch');
  await becomeRecruiter(request, api, account);

  await signIn(page, account.email);
  (await switcherTrigger(page)).click();
  await page.getByRole('menuitem', { name: /recruiting/i }).click();

  await page.waitForURL(/\/recruiter/, { timeout: 15_000 });

  // The active workspace is derived from the address, so it is right here
  // without anything having been stored. The recruiting workspace has its own
  // layout and no drawer, so the switcher must be in its header at every
  // breakpoint - otherwise a phone lands here with no way back out.
  await expect(
    page.getByRole('button', { name: /current workspace: recruiting/i })
  ).toBeVisible();

  // ...it survives a reload for the same reason...
  await page.reload();
  await expect(
    page.getByRole('button', { name: /current workspace: recruiting/i })
  ).toBeVisible();

  // ...and Back returns to the previous workspace without being taught to.
  await page.goBack();
  await expect(await switcherTrigger(page)).toHaveAccessibleName(/current workspace: professional/i);
});

/*
 * Where signing in lands.
 *
 * Post-login routing used to guess a destination from roleId, defaulting to a
 * 'candidate' persona the backend has never had. It does not guess at all now:
 * a returnUrl wins, then the workspace this account itself chose, then the
 * feed. The first test below is the one that used to stand alone, and it still
 * holds - holding a workspace is not choosing it.
 */

async function submitSignIn(page: import('@playwright/test').Page, email: string) {
  await page.goto('/signin');
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('an account that has chosen nothing lands on the feed, whatever it may enter', async ({
  page,
  request,
}) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-landing');
  await becomeRecruiter(request, api, account);

  // This account holds recruiting and has never chosen it. Holding a workspace
  // is not the same as wanting to start in it.
  await submitSignIn(page, account.email);

  await page.waitForURL(/\/feed/, { timeout: 15_000 });
  expect(new URL(page.url()).pathname).toBe('/feed');
});

test('signing in returns to the workspace the account last chose', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-remember');
  await becomeRecruiter(request, api, account);

  // Chosen through the switcher itself, so this covers the write as well as the
  // landing - a preference the control never records is a preference nobody has.
  await signIn(page, account.email);
  (await switcherTrigger(page)).click();
  await page.getByRole('menuitem', { name: /recruiting/i }).click();
  await page.waitForURL(/\/recruiter/, { timeout: 15_000 });

  // A fresh sign-in, with no returnUrl, opens where they were working.
  await page.context().clearCookies();
  await submitSignIn(page, account.email);

  await page.waitForURL(/\/recruiter/, { timeout: 15_000 });
  expect(new URL(page.url()).pathname).toMatch(/^\/recruiter/);
});

test('a requested page wins over the workspace the account last chose', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-returnurl');
  await becomeRecruiter(request, api, account);

  const chosen = await request.put(`${api}/api/v1/workspace/preference`, {
    headers: { Authorization: `Bearer ${account.token}` },
    data: { key: 'recruiting' },
  });
  expect(chosen.status()).toBe(204);

  // Asking for a page is a stronger statement than a remembered workspace.
  await page.goto('/signin?returnUrl=%2Fjobs');
  await page.getByLabel(/email/i).first().fill(account.email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/\/jobs/, { timeout: 15_000 });
  expect(new URL(page.url()).pathname).toBe('/jobs');
});

test('choosing a workspace the account does not hold is refused', async ({ request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-pref-authz');

  // Never onboarded, so recruiting is not this account's to choose. The refusal
  // protects nothing - a stored key grants no access - but a key that resolves
  // to nothing would be a preference that behaves like none.
  const refused = await request.put(`${api}/api/v1/workspace/preference`, {
    headers: { Authorization: `Bearer ${account.token}` },
    data: { key: 'recruiting' },
  });
  expect(refused.status()).toBe(403);
});

test('the switcher is navigation, not authorization', async ({ page, request }) => {
  const api = process.env.TEST_API_URL!;
  const account = await registerAccount(request, api, 'ws-authz');

  await signIn(page, account.email);

  // This account never onboarded, so the server offers it no recruiting
  // workspace - and the route refuses it regardless of what any menu shows.
  const refused = await request.get(`${api}/api/v1/recruiter/dashboard`, {
    headers: { Authorization: `Bearer ${account.token}` },
  });
  expect(refused.status()).toBe(403);
});

/*
 * Navigation that follows the workspace.
 *
 * The bottom bar is meant to carry the primary destinations of the workspace
 * the account is in. On a phone that is the difference between a recruiter
 * reaching their pipeline in one tap and being offered Feed, Network and Jobs -
 * none of which is where they are.
 *
 * The bar only exists below `md` (768px in src/theme/breakpoints.ts), so this
 * describes its own viewport rather than skipping on the desktop projects: the
 * behaviour is worth checking on every engine, and a skipped test would fail
 * the mandatory gate in scripts/ci/check-results.mjs anyway.
 *
 * Deciding phone-ness by asking whether a nav named "Primary" is on screen does
 * not work, and the first version of this test was wrong for that reason: the
 * header's desktop row carries the same landmark name, one of the two is always
 * showing, and on Desktop Chrome the test ended up asserting against the header.
 */
test.describe('on a phone', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('the bottom bar carries the destinations of the workspace you are in', async ({ page, request }) => {
    const api = process.env.TEST_API_URL!;
    const account = await registerAccount(request, api, 'ws-bottomnav');
    await becomeRecruiter(request, api, account);

    await signIn(page, account.email);

    // Below `md` the header's row is display:none, which takes it out of the
    // accessibility tree, so this name resolves to the bottom bar alone. The
    // count assertion holds that guarantee rather than assuming it.
    const bottomBar = page.getByRole('navigation', { name: 'Primary' });
    await expect(bottomBar).toHaveCount(1);

    // Professional: the five a thumb reaches for.
    await expect(bottomBar.getByRole('link', { name: /feed/i })).toBeVisible();
    await expect(bottomBar.getByRole('link', { name: /pipeline/i })).toHaveCount(0);

    (await switcherTrigger(page)).click();
    await page.getByRole('menuitem', { name: /recruiting/i }).click();
    await page.waitForURL(/\/recruiter/, { timeout: 15_000 });

    // Recruiting: its own destinations, and every one of them inside it.
    const recruitingBar = page.getByRole('navigation', { name: 'Primary' });
    await expect(recruitingBar).toHaveCount(1);
    await expect(recruitingBar.getByRole('link', { name: /pipeline/i })).toBeVisible();
    await expect(recruitingBar.getByRole('link', { name: /^feed$/i })).toHaveCount(0);

    for (const link of await recruitingBar.getByRole('link').all()) {
      expect(await link.getAttribute('href')).toMatch(/^\/recruiter/);
    }
  });
});
