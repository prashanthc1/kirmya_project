import { test, expect } from '@playwright/test';
import { settled } from './helpers';

test('built signin page makes a real API request and anonymous identity is denied', async ({ page, request }) => {
  const api = process.env.TEST_API_URL;
  expect(api, 'TEST_API_URL is mandatory').toBeTruthy();
  const anonymous = await request.get(`${api}/api/v1/auth/me`);
  expect(anonymous.status()).toBe(401);
  await page.goto('/signin');
  const email = page.getByRole('textbox', { name: 'Email Address' });
  const password = page.getByLabel('Password', { exact: true });
  await expect(email).toBeVisible();
  await email.fill('absent-ci-user@example.invalid');
  await password.fill('Disposable-CI-password-123!');
  const response = page.waitForResponse(r => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST');
  await page.locator('button[type="submit"]').click();
  expect((await response).status()).toBe(401);
  await expect(page).toHaveURL(/signin/);
});

// Batch 2, step 5: the production build must address the API through one base.
//
// NEXT_PUBLIC_API_URL already includes /api/v1, but the telemetry and web-vitals
// callers appended their own, producing /api/v1/api/v1/telemetry/... — a 404 on
// every client error report from a real deployment. This asserts the shape of
// every API request the built page actually issues rather than reading the
// source, so a caller that re-derives the base wrongly fails here.
test('the production build issues no doubled /api/v1 requests', async ({ page }) => {
  const api = process.env.TEST_API_URL;
  expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

  const apiRequests: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith(`${api}/`)) {
      apiRequests.push(url);
    }
  });

  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
  // Give any deferred telemetry or vitals reporter a chance to fire.
  await page.waitForTimeout(1500);

  const doubled = apiRequests.filter((u) => u.includes('/api/v1/api/v1/'));
  expect(doubled, `requests with a doubled API prefix: ${doubled.join(', ')}`).toEqual([]);

  // Anything addressed at the API host must sit under the versioned prefix.
  const offBase = apiRequests.filter((u) => !u.startsWith(`${api}/api/v1/`));
  expect(offBase, `API-host requests outside /api/v1: ${offBase.join(', ')}`).toEqual([]);
});

// The built bundle must not ship the synthetic bearer that several feature
// clients used to send in place of the signed-in user's token.
test('the production bundle carries no synthetic bearer identity', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    const type = response.headers()['content-type'] || '';
    if (type.includes('javascript')) {
      try {
        scripts.push(await response.text());
      } catch {
        // A script that cannot be read back is not evidence either way.
      }
    }
  });

  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
  await page.waitForTimeout(1000);

  const offending = scripts.filter((body) => body.includes('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d'));
  expect(offending.length, 'a served script still embeds the synthetic bearer UUID').toBe(0);
});

test('candidate application receipt survives reload against real storage and API', async ({ page, request }, testInfo) => {
  // Two registrations and two sign-ins at bcrypt cost 12, a job publication, a
  // real upload, an application and two page loads. That does not fit the 20s
  // default the lighter specs use, and three of the four browser projects ran
  // past it; this test is slow rather than flaky.
  test.slow();
  const api = process.env.TEST_API_URL!;
  const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const password = 'Disposable-CI-password-123!';
  const register = async (kind: string) => {
    const email = `pw-b3-${kind}-${suffix}@example.invalid`;
    const registration = await request.post(`${api}/api/v1/auth/register`, { data: { firstName: kind, lastName: 'Batch3', email, password, acceptTerms: true, acceptPrivacy: true } });
    expect(registration.status()).toBe(201);
    const login = await request.post(`${api}/api/v1/auth/login`, { data: { email, password } });
    expect(login.status()).toBe(200);
    const body = await login.json();
    return { email, id: (await registration.json()).user_id as string, token: body.accessToken || body.token };
  };
  const recruiter = await register('Recruiter');
  const candidate = await register('Candidate');
  const title = `Browser durable role ${suffix}`;
  const createdJob = await request.post(`${api}/api/v1/recruiter/jobs`, { headers: { Authorization: `Bearer ${recruiter.token}` }, data: { title, description: 'Browser batch 3 role', status: 'Active', workplaceType: 'Remote', employmentType: 'Full-time' } });
  expect(createdJob.status()).toBe(201);
  const jobId = (await createdJob.json()).id as string;
  expect(jobId).toBeTruthy();
  const upload = await request.post(`${api}/api/v1/documents/upload`, { headers: { Authorization: `Bearer ${candidate.token}` }, multipart: { title: 'Browser resume', document_type: 'Resume', is_default: 'true', file: { name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nBrowser real document\n%%EOF') } } });
  expect(upload.status()).toBe(201);
  const document = await upload.json();
  expect(document.sha256).toHaveLength(64);
  const application = await request.post(`${api}/api/v1/jobs/${jobId}/apply`, { headers: { Authorization: `Bearer ${candidate.token}` }, data: { resume_id: document.id, contact_name: 'Browser Edited Name', contact_email: candidate.email, cover_letter: 'Browser durable cover letter', idempotency_key: suffix } });
  expect(application.status()).toBe(201);
  const receipt = await application.json();
  expect(receipt.summary.job_title).toBe(title);
  expect(receipt.submitted_resume.sha256).toBe(document.sha256);

  await page.goto('/signin');
  // These pages hydrate by briefly mounting a second copy of the tree. Filling
  // before that window closes types into the copy that is about to be discarded,
  // so the form submits without the credentials and the API answers 401.
  const emailField = page.getByRole('textbox', { name: 'Email Address' });
  await settled(emailField);
  await emailField.fill(candidate.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const signedIn = page.waitForResponse(r => r.url() === `${api}/api/v1/auth/login` && r.request().method() === 'POST');
  await page.locator('button[type="submit"]').click();
  expect((await signedIn).status()).toBe(200);
  // The form redirects on a short timer after storing the session. Navigating
  // on the login response alone leaves before that happens, and the next page
  // then loads unauthenticated: /api/v1/applications answers 401 and the board
  // is empty for reasons that have nothing to do with persistence.
  await expect(page).not.toHaveURL(/signin/);
  await page.goto('/applications');
  await settled(page.getByText(title).first());
  await page.reload();
  await settled(page.getByText(title).first());
});
