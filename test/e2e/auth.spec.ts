import { test, expect } from '@playwright/test';
import { settled } from './helpers';

// Every assertion below is anchored to markup that exists in
// frontend/src/components/auth and frontend/src/app/{signin,register,forgot-password,reset-password}.
// Client-side validation only: no account is created, so the CI database stays
// empty and these stay deterministic across reruns.
//
// Each page is identified by its <h1> through settled(), which also waits out
// the hydration double-mount described in helpers.ts before anything is
// clicked or filled.

test.describe('Authentication & User Identity Flow', () => {
  test('Saved dark appearance hydrates readable authentication content', async ({ page, context, baseURL }) => {
    await context.addCookies([{
      name: 'kirmya-theme-mode',
      value: 'dark',
      url: baseURL!,
      sameSite: 'Lax',
    }]);
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    await page.goto('/signin');
    const heading = page.getByRole('heading', { name: 'Sign In to Kirmya' });
    await settled(heading);
    await page.getByRole('textbox', { name: 'Email Address' }).fill('candidate@example.invalid');

    const contrast = await heading.evaluate((element) => {
      const luminance = (color: string) => {
        const rgb = color.match(/[0-9.]+/g)!.slice(0, 3).map(Number);
        const linear = rgb.map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      let surface: Element | null = element;
      while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') {
        surface = surface.parentElement;
      }
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(getComputedStyle(surface!).backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(hydrationErrors).toEqual([]);
  });

  test('Sign in page renders and rejects a malformed email', async ({ page }) => {
    await page.goto('/signin');

    await settled(page.getByRole('heading', { name: 'Sign In to Kirmya' }));

    // Empty submit surfaces the required-field messages from signInSchema.
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email address is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'Email Address' }).fill('invalid-email-format');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('Registration form enforces its schema before calling the API', async ({ page }) => {
    await page.goto('/signup');

    await settled(page.getByRole('heading', { name: 'Create your account' }));

    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email address is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'First Name' }).fill('New');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('User');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('candidate@example.invalid');
    await page.getByLabel('Password (min 12 characters)').fill('short');
    await page.getByLabel('Confirm Password').fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password must be at least 12 characters long')).toBeVisible();
    // Nothing was submitted, so the page must not have navigated away.
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('Forgot password rejects a malformed address before sending', async ({ page }) => {
    await page.goto('/forgot-password');

    await settled(page.getByRole('heading', { name: 'Forgot Password' }));

    await page.getByRole('textbox', { name: 'Email Address' }).fill('not-an-address');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  });

  test('Reset password refuses a tokenless link and a weak password', async ({ page }) => {
    // No token in the query string: the page must say so rather than render a form
    // that would post an empty token.
    await page.goto('/reset-password');
    await settled(page.getByRole('heading', { name: 'Reset link is incomplete' }));

    await page.goto('/reset-password?token=ci-placeholder-token');
    await settled(page.getByRole('heading', { name: 'Reset Password' }));

    await page.getByLabel('New Password (min 12 characters)').fill('short');
    await page.getByLabel('Confirm New Password').fill('short');
    await page.getByRole('button', { name: 'Set New Password' }).click();

    await expect(page.getByText('Password must be at least 12 characters long')).toBeVisible();
  });
});
