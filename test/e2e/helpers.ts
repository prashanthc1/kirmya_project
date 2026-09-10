import { expect, APIRequestContext, Locator, Page } from '@playwright/test';

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

  await becomeRecruiter(request, api, { email, token });

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

/** A disposable account, registered and signed in through the API. */
export interface SeededAccount {
  id: string;
  email: string;
  token: string;
}

/** Registers a disposable account and returns its id, email and access token. */
export async function registerAccount(
  request: APIRequestContext,
  api: string,
  role: string,
  firstName = 'Journey',
  lastName = 'Account'
): Promise<SeededAccount> {
  const email = `pw-${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.invalid`;

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      firstName,
      lastName,
      email,
      password: DISPOSABLE_PASSWORD,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  expect(registration.status(), await registration.text()).toBe(201);
  const id = (await registration.json()).user_id as string;

  const login = await request.post(`${api}/api/v1/auth/login`, {
    data: { email, password: DISPOSABLE_PASSWORD },
  });
  expect(login.status(), await login.text()).toBe(200);

  return { id, email, token: (await login.json()).accessToken as string };
}

/**
 * Completes recruiter onboarding for an account, so it holds the standalone
 * Recruiting capability.
 *
 * Every recruiter seed below used to skip this: registering an account was
 * enough to publish a job, because the first call to a recruiter route
 * provisioned the profile behind it. That was the defect. /recruiter/* now
 * answers 403 RECRUITER_ONBOARDING_REQUIRED until this runs, so a spec that
 * needs a recruiter has to say so - which is the same step a real person takes.
 */
export async function becomeRecruiter(
  request: APIRequestContext,
  api: string,
  account: SeededAccount | { email: string; token: string }
): Promise<void> {
  const onboarded = await request.post(`${api}/api/v1/recruiter/onboarding`, {
    headers: { Authorization: `Bearer ${account.token}` },
    data: {
      companyName: 'Playwright Recruiting Co',
      jobTitle: 'Talent Partner',
      recruiterRole: 'Recruiter',
      department: 'Talent Acquisition',
      contactEmail: account.email,
    },
  });
  expect(onboarded.status(), await onboarded.text()).toBe(200);
}

/**
 * Seeds the whole hiring relationship these recruiter journeys need: a
 * recruiter with a published posting, and a real person who has applied to it.
 *
 * The recruiter screens used to need none of this — they rendered the same
 * invented candidates whatever the database held — so there was nothing for a
 * journey to be about. Every assertion downstream names the person seeded here.
 */
export async function seedRecruiterWithApplicant(
  request: APIRequestContext,
  api: string
): Promise<{
  recruiter: SeededAccount;
  candidate: SeededAccount;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  coverLetter: string;
}> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const recruiter = await registerAccount(request, api, 'rec', 'Journey', 'Recruiter');
  await becomeRecruiter(request, api, recruiter);

  // A distinctive given name, so an assertion that finds it on the page cannot
  // be satisfied by anything the build happens to ship.
  const firstName = 'Ngozi';
  const lastName = `Adeyemi${suffix.replace(/[^0-9]/g, '').slice(-6)}`;
  const candidate = await registerAccount(request, api, 'can', firstName, lastName);

  const jobTitle = `Journey Platform Engineer ${suffix}`;
  const created = await request.post(`${api}/api/v1/recruiter/jobs`, {
    headers: { Authorization: `Bearer ${recruiter.token}` },
    data: {
      title: jobTitle,
      description: 'A real posting seeded by the recruiter journey spec.',
      status: 'Active',
      workplaceType: 'Remote',
      employmentType: 'Full-time',
      location: 'Remote',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const jobId = (await created.json()).id as string;

  const coverLetter = `Cover letter written by the journey spec ${suffix}.`;
  const applied = await request.post(`${api}/api/v1/jobs/${jobId}/apply`, {
    headers: { Authorization: `Bearer ${candidate.token}` },
    data: { cover_letter: coverLetter },
  });
  expect(applied.status(), await applied.text()).toBe(201);
  const applicationId = (await applied.json()).summary.id as string;

  return {
    recruiter,
    candidate,
    candidateName: `${firstName} ${lastName}`,
    jobId,
    jobTitle,
    applicationId,
    coverLetter,
  };
}

/** Signs in through the real form, so the session is the one the app issues. */
export async function signIn(page: Page, api: string, email: string): Promise<void> {
  await page.goto('/signin');

  const emailField = page.getByRole('textbox', { name: 'Email Address' });
  await expect(emailField).toHaveCount(1, { timeout: 15_000 });
  await expect(emailField).toBeVisible({ timeout: 15_000 });
  await emailField.fill(email);
  await page.getByLabel('Password', { exact: true }).fill(DISPOSABLE_PASSWORD);

  const signedIn = page.waitForResponse(
    (r) => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Sign In' }).click();
  expect((await signedIn).status()).toBe(200);
  await expect(page).not.toHaveURL(/signin/, { timeout: 15_000 });
}

/**
 * The invented people these screens used to present as real. Any journey that
 * renders one of these has regressed to fabricating.
 */
export const INVENTED_PEOPLE = [
  'Sarah Chen',
  'Tariq Al-Mansoor',
  'Elena Rostova',
  'Rashid Al-Maktoum',
  'Amira Al-Farsi',
];
