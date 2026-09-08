import { expect, APIRequestContext, Locator } from '@playwright/test';

/**
 * Asserts a page anchor is present exactly once, then visible.
 *
 * These pages are server-rendered and then hydrated, and the client briefly
 * mounts a second copy of the tree before discarding the server one — the two
 * copies are visible as differing React ids on otherwise identical elements
 * (`_r_0_` against `_R_hl9kklubtfb_`). Any locator evaluated inside that window
 * resolves to two elements and trips Playwright's strict mode, which is why the
 * same tests failed on a different browser each run.
 *
 * Gating on the count both waits the window out and asserts that it closes: a
 * page that genuinely rendered its content twice would still fail here, so this
 * absorbs the race without hiding a duplicate.
 */
export async function settled(locator: Locator): Promise<void> {
  await expect(locator).toHaveCount(1);
  await expect(locator).toBeVisible();
}

/** A password used only by disposable accounts these specs create. */
export const DISPOSABLE_PASSWORD = 'Disposable-CI-password-123!';

/**
 * Publishes a real job through the API and returns its id and title.
 *
 * Specs that need a posting seed their own rather than reading whatever the
 * board happens to hold. The suite runs with one worker and no fixed file
 * order, so a spec that depended on another having run first would skip on a
 * fresh database — and a skipped test fails the CI gate in
 * scripts/ci/check-results.mjs, by design.
 */
export async function publishJob(
  request: APIRequestContext,
  api: string
): Promise<{ id: string; title: string }> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `pw-seed-${suffix}@example.invalid`;

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      firstName: 'Seed',
      lastName: 'Recruiter',
      email,
      password: DISPOSABLE_PASSWORD,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  expect(registration.status(), await registration.text()).toBe(201);

  const login = await request.post(`${api}/api/v1/auth/login`, {
    data: { email, password: DISPOSABLE_PASSWORD },
  });
  expect(login.status()).toBe(200);
  const token = (await login.json()).accessToken;

  const title = `Indexable Staff Engineer ${suffix}`;
  const created = await request.post(`${api}/api/v1/recruiter/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description:
        'A real posting seeded by an end-to-end spec, with enough description text to exercise the meta description trimming.',
      status: 'Active',
      workplaceType: 'Remote',
      employmentType: 'Full-time',
      location: 'Remote',
    },
  });
  expect(created.status(), await created.text()).toBe(201);

  return { id: (await created.json()).id as string, title };
}
