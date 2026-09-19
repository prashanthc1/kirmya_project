import { test, expect } from '@playwright/test';
import {
  INVENTED_PEOPLE,
  seedRecruiterWithApplicant,
  signIn,
} from './helpers';

/**
 * Recruiter pipeline journey against real records and a real API.
 *
 * Seeds a real posting and applicant, opens the pipeline board, asserts the
 * seeded applicant is displayed (and no invented candidates appear), posts
 * an internal recruiter note, reloads, and proves the note survives.
 */
test.describe('Recruiter pipeline against real records', () => {
  test('pipeline shows real applicant and candidate notes survive reload', async ({
    page,
    request,
  }) => {
    test.slow();
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const seeded = await seedRecruiterWithApplicant(request, api!);
    await signIn(page, api!, seeded.recruiter.email);

    // 1. Open pipeline board
    await page.goto(`/recruiter/pipeline?jobId=${seeded.jobId}`);

    // 2. Assert seeded applicant name is visible on the pipeline board
    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });

    // 3. Verify no invented candidates appear on the pipeline
    const body = page.locator('body');
    for (const invented of INVENTED_PEOPLE) {
      await expect(body).not.toContainText(invented);
    }

    // 4. Open candidate details and post a note
    await page.getByText(seeded.candidateName).first().click();
    await expect(page.getByText(seeded.candidateName).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('tab', { name: /Recruiter Internal Notes/i }).click();

    const noteText = `Pipeline evaluation note ${Date.now()}`;
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
    expect((await posted).status(), 'the note was not accepted by the server').toBeLessThan(300);

    // 5. Reload page and assert note is still there
    await page.reload();
    await page.getByRole('tab', { name: /Recruiter Internal Notes/i }).click();
    await expect(page.getByText(noteText).first()).toBeVisible({ timeout: 20_000 });
  });
});
