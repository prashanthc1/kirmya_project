import { test, expect } from '@playwright/test';
import { settled } from './helpers';

// /messaging is a redirect stub (frontend/src/app/messaging/page.tsx) onto
// /messages. The conversation endpoints sit behind AuthRequired
// (backend/internal/messaging/delivery/http/routes.go), so an anonymous visit
// must be denied by the real API and the pane must stay empty rather than
// rendering fabricated conversations.

test.describe('Messaging Shell & Anonymous Access', () => {
  test('Legacy /messaging path redirects to /messages', async ({ page }) => {
    await page.goto('/messaging');
    await expect(page).toHaveURL(/\/messages$/);
    await settled(page.getByRole('heading', { name: 'Messages' }));
  });

  test('Anonymous conversation load is refused by the real API', async ({ page }) => {
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    const conversations = page.waitForResponse(
      (r) =>
        r.url() === `${api}/api/v1/messages/conversations` && r.request().method() === 'GET'
    );
    await page.goto('/messages');

    expect((await conversations).status()).toBe(401);

    // Nothing loaded, so the list stays empty. Asserted on the list pane rather
    // than the reading pane: the reading pane is display:none on mobile widths
    // while no conversation is selected.
    await settled(page.getByText('No conversations yet'));
  });
});
