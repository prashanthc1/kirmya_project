import { test, expect } from '@playwright/test';

test.describe('AI Career Assistant Interaction Flow', () => {
  test('Interact with Career Assistant AI Chatbot', async ({ page }) => {
    await page.goto('/career-ai');
    await page.fill('input[id="ai-prompt-input"]', 'How can I optimize my resume for a Staff Go Architect role?');
    await page.click('button[id="send-prompt-btn"]');

    // Expect assistant response message
    await expect(page.locator('.ai-message-bubble')).toContainText(/Go|microservices|architecture|resume/i);
  });
});
