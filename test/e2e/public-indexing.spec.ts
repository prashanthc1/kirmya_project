import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * F10. A job posting must be in the HTML a crawler receives.
 *
 * Every page in this app was a client component, so the served HTML was an
 * empty shell and the posting only existed after JavaScript ran. No individual
 * job could be indexed, none was eligible for Google for Jobs, `generateMetadata`
 * appeared nowhere, and the sitemap listed six hardcoded URLs and not one job.
 *
 * These assertions all read the raw HTML — never the hydrated DOM — because
 * that is what a crawler gets.
 */

const PASSWORD = 'Disposable-CI-password-123!';

/** Publishes a real job and returns its id and title. */
async function publishJob(request: APIRequestContext, api: string) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `pw-seo-${suffix}@example.invalid`;

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      firstName: 'SEO', lastName: 'Recruiter', email, password: PASSWORD,
      acceptTerms: true, acceptPrivacy: true,
    },
  });
  expect(registration.status()).toBe(201);

  const login = await request.post(`${api}/api/v1/auth/login`, { data: { email, password: PASSWORD } });
  expect(login.status()).toBe(200);
  const token = (await login.json()).accessToken;

  const title = `Indexable Staff Engineer ${suffix}`;
  const created = await request.post(`${api}/api/v1/recruiter/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description:
        'A real posting seeded by the public indexing spec, with enough description text to exercise the meta description trimming.',
      status: 'Active',
      workplaceType: 'Remote',
      employmentType: 'Full-time',
      location: 'Remote',
    },
  });
  expect(created.status(), await created.text()).toBe(201);

  return { id: (await created.json()).id as string, title };
}

test.describe('Public job indexing', () => {
  test('a job posting is in the served HTML, not only after hydration', async ({ request }) => {
    test.slow();
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();
    const base = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    const job = await publishJob(request, api!);

    // Fetched as a crawler would: no browser, no JavaScript.
    const page = await request.get(`${base}/jobs/${job.id}`);
    expect(page.status()).toBe(200);
    const html = await page.text();

    expect(html, 'the posting title is not in the served HTML').toContain(job.title);

    // A per-job title, not the site-wide default.
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    expect(title).toContain(job.title);

    // A self-canonical, so the posting does not compete with a parameterised
    // variant of itself.
    expect(html).toContain(`/jobs/${job.id}`);
    expect(html).toMatch(/rel="canonical"/);
  });

  test('the posting carries valid JobPosting structured data', async ({ request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const base = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    const job = await publishJob(request, api);
    const html = await (await request.get(`${base}/jobs/${job.id}`)).text();

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
      .map((m) => {
        try {
          return JSON.parse(m[1]);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const posting = blocks.find((b) => b['@type'] === 'JobPosting');
    expect(posting, 'no JobPosting structured data; the job cannot appear in Google for Jobs').toBeTruthy();

    // The fields Google actually checks. A posting missing datePosted or
    // hiringOrganization is rejected from the jobs index.
    expect(posting.title).toBe(job.title);
    expect(posting.datePosted, 'datePosted is required').toBeTruthy();
    expect(posting.jobLocation ?? posting.jobLocationType, 'a location or TELECOMMUTE is required').toBeTruthy();
    expect(posting.employmentType).toBe('FULL_TIME');
    // Remote roles need this specific marker or the location is read as the
    // only place the job can be done.
    expect(posting.jobLocationType).toBe('TELECOMMUTE');

    // Nothing invented: a wrong baseSalary is worse than an absent one, because
    // it is a field search engines verify.
    if ('baseSalary' in posting) {
      expect(posting.baseSalary.currency).toBeTruthy();
    }
  });

  test('the sitemap lists real open postings, not a hardcoded handful', async ({ request }) => {
    test.slow();
    const api = process.env.TEST_API_URL!;
    const base = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    await publishJob(request, api);

    const sitemap = await request.get(`${base}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();

    const jobUrls = [...xml.matchAll(/<loc>[^<]*\/jobs\/[0-9a-f-]{36}<\/loc>/g)];
    expect(
      jobUrls.length,
      'the sitemap contains no job postings; a crawler is told the board has none'
    ).toBeGreaterThan(0);

    // The board itself is still listed, and sign-in is not: it has nothing to
    // rank for, and every crawl of it is budget spent on a dead end.
    expect(xml).toContain('/jobs</loc>');
    expect(xml).not.toContain('/signin');
  });

  test('a posting that is gone is not offered to the index', async ({ request }) => {
    const base = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    const response = await request.get(`${base}/jobs/00000000-0000-0000-0000-000000000000`, {
      failOnStatusCode: false,
    });
    const html = await response.text();

    // The page says what happened rather than rendering an empty posting.
    expect(html).toContain('no longer open');

    // And it is marked noindex.
    //
    // Note what this does not assert: a 404 status. notFound() does not set one
    // for a dynamic route segment on this Next version — a minimal probe route
    // reproduces it with no application code involved — so gone postings are
    // currently soft 404s. noindex keeps them out of the index; the status is
    // tracked as an open gate. Assert noindex here rather than the status, so
    // this test states what is actually true today.
    expect(html).toMatch(/name="robots"[^>]*noindex/);
  });

  test('robots.txt keeps crawlers off authenticated surfaces', async ({ request }) => {
    const base = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';

    const robots = await (await request.get(`${base}/robots.txt`)).text();

    expect(robots).toContain('Sitemap:');
    for (const path of ['/admin/', '/settings/', '/messages/', '/notifications/']) {
      expect(robots, `${path} is crawlable but always redirects to sign-in`).toContain(path);
    }
  });
});
