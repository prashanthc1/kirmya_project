import { test, expect } from '@playwright/test';

test.describe('Real-Time Messaging & Chat Room Flow', () => {
  test('Send Message to Connection', async ({ page }) => {
    await page.goto('/messaging');
    await page.click('.conversation-item:first-child');

    await page.fill('input[id="chat-message-input"]', 'Hello, looking forward to discussing the Senior Go Architect position!');
    await page.click('button[id="send-message-btn"]');

    await expect(page.locator('.message-bubble:last-child')).toContainText('Hello, looking forward to discussing');
  });
});
