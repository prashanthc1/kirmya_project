import { test, expect } from '@playwright/test';

// The assistant lives at /career-assistant (frontend/src/app/career-assistant),
// not the /career-ai route the previous version of this spec invented. The page
// falls back to local sample recommendations when the AI endpoints are
// unavailable, so its shell and tab wiring are assertable without a live model.

test.describe('AI Career Assistant Studio', () => {
  test('Studio renders its tools and keeps inputs editable', async ({ page }) => {
    await page.goto('/career-assistant');

    await expect(
      page.getByRole('heading', { name: 'AI-Ready Career Assistant Studio' })
    ).toBeVisible();

    for (const label of [
      'Career Trajectory',
      'Resume Critique',
      'Skill Gap Bridge',
      'Job Search Strategy',
      'Mock Interview Prep',
    ]) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }

    const currentRole = page.getByLabel('Current Role');
    await expect(currentRole).toBeVisible();
    await currentRole.fill('Backend Engineer');
    await expect(currentRole).toHaveValue('Backend Engineer');

    await expect(page.getByRole('button', { name: 'Generate Career Strategy' })).toBeVisible();
  });

  test('Switching tabs swaps the input and its action', async ({ page }) => {
    await page.goto('/career-assistant');
    await expect(
      page.getByRole('heading', { name: 'AI-Ready Career Assistant Studio' })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Resume Critique' }).click();
    await expect(page.getByLabel('Paste Resume Text for AI Critique')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Critique & Fix Resume' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Career Strategy' })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Mock Interview Prep' }).click();
    await expect(page.getByLabel('Interview Focus Area')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Generate Mock Interview Guide' })
    ).toBeVisible();
  });
});
