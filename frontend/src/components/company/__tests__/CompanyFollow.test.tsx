import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyFollow from '../CompanyFollow';
import { renderWithProviders } from '../../../test/utils';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    follow: vi.fn(),
    unfollow: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

describe('CompanyFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.follow.mockResolvedValue(undefined as never);
    api.unfollow.mockResolvedValue(undefined as never);
  });

  it('follows a company the viewer is not yet following', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyFollow
        identifier="northwind-logistics"
        companyId="company-1"
        isFollowing={false}
        isAuthenticated
      />
    );

    const button = screen.getByRole('button', { name: /follow/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);

    await waitFor(() => expect(api.follow).toHaveBeenCalledWith('company-1'));
    expect(api.unfollow).not.toHaveBeenCalled();
  });

  it('unfollows when the viewer already follows', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyFollow
        identifier="northwind-logistics"
        companyId="company-1"
        isFollowing
        isAuthenticated
      />
    );

    const button = screen.getByRole('button', { name: /following/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(button);

    await waitFor(() => expect(api.unfollow).toHaveBeenCalledWith('company-1'));
  });

  // An anonymous visitor gets a sign-in prompt rather than a request that the
  // server would reject.
  it('sends an anonymous visitor to sign in without calling the API', async () => {
    const user = userEvent.setup();
    const requireSignIn = vi.fn();

    renderWithProviders(
      <CompanyFollow
        identifier="northwind-logistics"
        companyId="company-1"
        isFollowing={false}
        isAuthenticated={false}
        onRequireSignIn={requireSignIn}
      />
    );

    await user.click(screen.getByRole('button', { name: /follow/i }));

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(api.follow).not.toHaveBeenCalled();
  });

  it('reports a failed follow instead of showing it as done', async () => {
    const user = userEvent.setup();
    api.follow.mockRejectedValue(new Error('nope'));

    renderWithProviders(
      <CompanyFollow
        identifier="northwind-logistics"
        companyId="company-1"
        isFollowing={false}
        isAuthenticated
      />
    );

    await user.click(screen.getByRole('button', { name: /follow/i }));

    expect(await screen.findByText(/did not go through/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /follow/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
