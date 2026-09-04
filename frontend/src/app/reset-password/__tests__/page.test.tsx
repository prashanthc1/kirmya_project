import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/utils';

const searchParams = { value: new URLSearchParams() };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

vi.mock('../../../services/authService', async () => {
  const actual = await vi.importActual<typeof import('../../../services/authService')>(
    '../../../services/authService'
  );
  return { ...actual, authApiClient: { post: vi.fn() } };
});

import { authApiClient } from '../../../services/authService';
import ResetPasswordPage from '../page';

const post = vi.mocked(authApiClient.post);

const axiosError = (status: number, data: unknown = {}) => ({
  isAxiosError: true,
  response: { status, data, headers: {} },
  message: `Request failed with status code ${status}`,
});

const VALID_TOKEN = 'a'.repeat(64);
const STRONG_PASSWORD = 'ReplacementP@ssw0rd456!';

const withToken = (token: string | null) => {
  searchParams.value = new URLSearchParams(token === null ? '' : `token=${token}`);
};

const fillAndSubmit = async (password: string, confirmation = password) => {
  const user = userEvent.setup();
  renderWithProviders(<ResetPasswordPage />);
  await user.type(await screen.findByLabelText(/new password \(min 12/i), password);
  await user.type(screen.getByLabelText(/confirm new password/i), confirmation);
  await user.click(screen.getByRole('button', { name: /set new password/i }));
  return user;
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withToken(VALID_TOKEN);
    post.mockResolvedValue({ data: { message: 'ok' } } as never);
  });

  it('sends the token from the link with the new password', async () => {
    await fillAndSubmit(STRONG_PASSWORD);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/reset-password', {
        token: VALID_TOKEN,
        password: STRONG_PASSWORD,
        new_password: STRONG_PASSWORD,
      });
    });
    expect(await screen.findByText(/password reset successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('explains the problem when the link carries no token', async () => {
    // Previously this rendered the full form, took a password and posted an
    // empty token, so the user met a generic server error at the end of a
    // process that could never have worked.
    withToken(null);
    renderWithProviders(<ResetPasswordPage />);

    expect(await screen.findByText(/reset link is incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a new reset link/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    expect(screen.queryByRole('button', { name: /set new password/i })).not.toBeInTheDocument();
  });

  it('refuses a password shorter than the server policy without calling the API', async () => {
    await fillAndSubmit('Short1!');

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 12 characters/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('refuses a mismatched confirmation without calling the API', async () => {
    await fillAndSubmit(STRONG_PASSWORD, 'DifferentP@ssw0rd456!');

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('reports an expired or already-used link and offers a new one', async () => {
    post.mockRejectedValueOnce(
      axiosError(400, { error: 'this password reset link has already been used' })
    );
    await fillAndSubmit(STRONG_PASSWORD);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/already been used/i);
    expect(screen.getByRole('link', { name: /get a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    expect(screen.queryByText(/password reset successfully/i)).not.toBeInTheDocument();
  });

  it('reports rate limiting distinctly from a rejected link', async () => {
    post.mockRejectedValueOnce(axiosError(429));
    await fillAndSubmit(STRONG_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
    // A throttled attempt is not a dead link, so it must not send the user off
    // to request a replacement they do not need.
    expect(screen.queryByRole('link', { name: /get a new link/i })).not.toBeInTheDocument();
  });

  it('reports a network failure rather than showing success', async () => {
    post.mockRejectedValueOnce(new Error('Network Error'));
    await fillAndSubmit(STRONG_PASSWORD);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/password reset successfully/i)).not.toBeInTheDocument();
  });
});
