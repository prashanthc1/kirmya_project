import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/utils';

// Only the HTTP client is replaced. extractApiError stays real, because the
// mapping from an API failure to the sentence a user reads is part of what
// these tests are checking.
vi.mock('../../../services/authService', async () => {
  const actual = await vi.importActual<typeof import('../../../services/authService')>(
    '../../../services/authService'
  );
  return { ...actual, authApiClient: { post: vi.fn() } };
});

import { authApiClient } from '../../../services/authService';
import ForgotPasswordPage from '../page';

const post = vi.mocked(authApiClient.post);

const axiosError = (status: number, data: unknown = {}) => ({
  isAxiosError: true,
  response: { status, data, headers: {} },
  message: `Request failed with status code ${status}`,
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({ data: { message: 'ok' } } as never);
  });

  const submit = async (email: string) => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email address/i), email);
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    return user;
  };

  it('submits the address and confirms that instructions were sent', async () => {
    await submit('Person@Example.com');

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'person@example.com', // normalised before it is sent
      });
    });
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it('says the same thing whether or not the address has an account', async () => {
    // The backend answers 200 either way; the page must not add a distinction
    // of its own by, say, reporting an unknown address differently.
    await submit('nobody@example.com');
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
  });

  it('surfaces rate limiting instead of claiming the email was sent', async () => {
    // This is the regression that mattered: the page caught every error and
    // showed the success screen, so a throttled user waited for a message that
    // was never sent.
    post.mockRejectedValueOnce(axiosError(429));
    await submit('person@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many reset requests/i);
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it('surfaces a server failure instead of claiming the email was sent', async () => {
    post.mockRejectedValueOnce(axiosError(500, { error: 'internal error' }));
    await submit('person@example.com');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it('surfaces a network failure instead of claiming the email was sent', async () => {
    post.mockRejectedValueOnce(new Error('Network Error'));
    await submit('person@example.com');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it('rejects a malformed address without calling the API', async () => {
    await submit('not-an-email');

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email address/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('lets the user go back and try a different address', async () => {
    const user = await submit('typo@example.com');
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /different email address/i }));
    expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument();
  });
});
