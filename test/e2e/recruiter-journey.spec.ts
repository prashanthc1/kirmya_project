import { test, expect } from '@playwright/test';
import {
  INVENTED_PEOPLE,
  seedRecruiterWithApplicant,
  signIn,
} from './helpers';

/**
 * The recruiter journey in a browser, against the production build and a real
 * API.
 *
 * F25 was nine reachable components presenting invented people as real. The
 * fix wired each to its endpoint, and the unit tests that came with it assert
 * that each states a failure when the network is unavailable. That proves they
 * stopped inventing. It does not prove they read, and the two are different
 * claims: a screen that renders "could not be loaded" forever satisfies every
 * one of those tests.
 *
 * These specs seed a real posting and a real applicant through the API, then
 * require that person — by name, on the page — everywhere the fabrications used
 * to be. Each one fails against the unfixed build twice over: the invented
 * person appears, and the seeded one does not.
 */
test.describe('Recruiter journey against real records', () => {
  test('the candidate list is the people who applied, not two invented ones', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto('/recruiter/candidates');

    // The person who actually applied is on the page.
    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });

    // None of the invented ones are, and neither is the match rating that was
    // attached to a candidate nobody had scored.
    const body = page.locator('body');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
    await expect(body).not.toContainText('96% AI match');
    await expect(body).not.toContainText('kirmya.com/resumes');
  });

  test('a candidate page shows the candidate it was asked for', async ({ page, request }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto(`/recruiter/candidates/${seeded.candidate.id}`);

    // This page ignored its id entirely and rendered one compiled-in person,
    // with a "Verified Profile" badge and a "96% MATCH" chip.
    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });
    const body = page.locator('body');
    await expect(body).not.toContainText('96% MATCH');
    await expect(body).not.toContainText('Verified Profile');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
  });

  test('an application shows the real candidate and the cover letter they wrote', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto(`/recruiter/applications/${seeded.applicationId}`);

    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(seeded.jobTitle).first()).toBeVisible();

    // The cover letter shown must be the one this candidate submitted, not the
    // paragraph signed "Sarah Chen" that every application used to display.
    await expect(page.getByText(seeded.coverLetter).first()).toBeVisible();

    const body = page.locator('body');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
  });

  test('a recruiter note survives a reload, because it reaches the server', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto(`/recruiter/candidates/${seeded.candidate.id}`);
    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('tab', { name: /Recruiter Internal Notes/i }).click();

    // The two notes this panel used to show, credited to colleagues who do not
    // exist, are gone.
    const body = page.locator('body');
    await expect(body).not.toContainText('Rashid Al-Maktoum');
    await expect(body).not.toContainText('Amira Al-Farsi');

    const noteText = `Journey note ${Date.now()}`;
    const box = page.getByPlaceholder(/Add internal evaluation notes/i);
    await expect(box).toBeVisible({ timeout: 15_000 });
    await box.fill(noteText);

    const posted = page.waitForResponse(
      (r) =>
        r.url().includes('/recruiter/candidates/') &&
        r.url().endsWith('/notes') &&
        r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /Post Private Note/i }).click();

    // Adding a note used to prepend it to a local array and stop. The request
    // is the point of this assertion: without it the note was never anywhere.
    expect((await posted).status(), 'the note was not sent to the server').toBeLessThan(300);

    // And it is still there after a reload, which the local-array version
    // could never survive.
    await page.reload();
    await page.getByRole('tab', { name: /Recruiter Internal Notes/i }).click();
    await expect(page.getByText(noteText).first()).toBeVisible({ timeout: 20_000 });
  });

  test('the interviews screen offers no invented interview and no pre-filled scorecard', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto('/recruiter/interviews');
    await expect(
      page.getByRole('heading', { name: /Interview Management/i }).first()
    ).toBeVisible({ timeout: 20_000 });

    const body = page.locator('body');

    // A recruiter who has scheduled nothing was shown a video interview with
    // "Sarah Chen" at a Google Meet link that does not exist.
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
    await expect(body).not.toContainText('meet.google.com');

    // The scorecard was rendered here standalone, with every score pre-set to
    // 5 of 5, a Strong Hire recommendation and a written assessment of a
    // candidate the interviewer had never met. It belongs to an interview, so
    // it is not on this page at all.
    await expect(body).not.toContainText('Structured Interview Scorecard');
    await expect(body).not.toContainText('exceptional mastery');
  });

  test('the offers screen states that offers cannot be listed instead of inventing two', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto('/recruiter/offers');
    // Level 1 exactly: the ATS layout's own subtitle mentions "job offers"
    // too, so a looser locator matches the chrome rather than the page.
    await expect(
      page.getByRole('heading', { level: 1, name: /Job Offer & Contract Workflow/i })
    ).toBeVisible({ timeout: 20_000 });

    // Two salary offers attached to named people who do not exist.
    const body = page.locator('body');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
    await expect(body).not.toContainText('$95,000');
    await expect(body).not.toContainText('$110,000');

    // The absence is stated rather than filled.
    await expect(body).toContainText(/Offers are not listed here/i);

    // And the button that would have posted a real offer against four
    // hardcoded identifiers is gone.
    await expect(page.getByRole('button', { name: /Create New Offer/i })).toHaveCount(0);
  });

  test('the pipeline board columns are stages an application can actually hold', async ({
    page,
    request,
  }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    await page.goto(`/recruiter/pipeline?jobId=${seeded.jobId}`);

    // A just-submitted application is in stage "Applied". The board's columns
    // were "New", "Review", "Recruiter Screen", "Final Interview" and "Hired",
    // none of which any row ever holds — so a real candidate matched no column
    // and was rendered nowhere. The board was legible only while it was
    // showing invented candidates carrying invented stages.
    const body = page.locator('body');
    await expect(body).not.toContainText('Recruiter Screen');
    await expect(body).not.toContainText('Final Interview');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }
  });
});
