import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyProfile from '../CompanyProfile';
import { renderWithProviders } from '../../../test/utils';
import { companyDetail } from '../../../test/fixtures';
import { CompanyDetail, ViewerContext } from '../../../features/company/types';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/company/northwind-logistics',
}));

const auth = { isAuthenticated: false };
vi.mock('../../../hooks/useAuth', () => ({
  default: () => auth,
  useAuth: () => auth,
}));

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getCompany: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const renderProfile = (company?: CompanyDetail) => {
  api.getCompany.mockResolvedValue((company ?? companyDetail()) as never);
  return renderWithProviders(
    <CompanyProfile slug="northwind-logistics" activeTab="home">
      {(loaded) => <div data-testid="tab-content">{loaded.name} home tab</div>}
    </CompanyProfile>
  );
};

describe('CompanyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated = false;
  });

  it('loads the company once and hands it to the tab', async () => {
    renderProfile();

    expect(await screen.findByTestId('tab-content')).toHaveTextContent(
      'Northwind Logistics home tab'
    );
    expect(api.getCompany).toHaveBeenCalledTimes(1);
    expect(api.getCompany).toHaveBeenCalledWith('northwind-logistics');
  });

  it('links every section of the company', async () => {
    renderProfile();

    await screen.findByTestId('tab-content');
    const tabs = screen.getByRole('tablist', { name: 'Company sections' });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute(
      'href',
      '/company/northwind-logistics/about'
    );
    expect(screen.getByRole('tab', { name: 'People' })).toHaveAttribute(
      'href',
      '/company/northwind-logistics/people'
    );
  });

  // A company the caller may not see and a company that does not exist are the
  // same answer, so a company id cannot be probed by reading the error.
  it('reports a company it cannot load without saying why', async () => {
    api.getCompany.mockRejectedValue(new Error('This company page is not available.'));

    renderWithProviders(
      <CompanyProfile slug="secret-co" activeTab="home">
        {() => <div data-testid="tab-content">loaded</div>}
      </CompanyProfile>
    );

    expect(await screen.findByText('Company not found')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-content')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse companies' })).toHaveAttribute(
      'href',
      '/company'
    );
  });

  it('sends an anonymous visitor to sign in with the page to come back to', async () => {
    const user = userEvent.setup();
    renderProfile();

    await screen.findByTestId('tab-content');
    await user.click(screen.getByRole('button', { name: /follow/i }));

    expect(push).toHaveBeenCalledWith('/signin?redirect=%2Fcompany%2Fnorthwind-logistics');
    expect(api.follow).not.toHaveBeenCalled();
  });
});

describe('CompanyHeader within the profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated = false;
  });

  // The badge is rendered from the server's `isVerified` alone. A submission
  // under review is not a verification, so it earns no badge.
  it('withholds the verified badge from a company still under review', async () => {
    renderProfile(companyDetail({ verificationStatus: 'pending', isVerified: false }));

    await screen.findByTestId('tab-content');
    expect(screen.queryByRole('img', { name: 'Verified company' })).not.toBeInTheDocument();
  });

  it('shows the verified badge for a verified company', async () => {
    renderProfile(companyDetail({ verificationStatus: 'verified', isVerified: true }));

    await screen.findByTestId('tab-content');
    expect(await screen.findByRole('img', { name: 'Verified company' })).toBeInTheDocument();
  });

  it('shows the figures the server supplied', async () => {
    renderProfile(companyDetail({ followersCount: 1280, openJobsCount: 6, employeesCount: 42 }));

    await screen.findByTestId('tab-content');
    expect(screen.getByText('1,280')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('People on Kirmya')).toBeInTheDocument();
  });

  // A company nobody has listed themselves at shows no employee figure at all,
  // rather than a zero that reads as a measurement.
  it('omits figures the company has no data for', async () => {
    renderProfile(
      companyDetail({ employeesCount: 0, reviewCount: 0, rating: 0, foundedYear: 0 })
    );

    await screen.findByTestId('tab-content');
    expect(screen.queryByText('People on Kirmya')).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Founded/)).not.toBeInTheDocument();
  });

  it('offers no management entry point to a visitor with no authority here', async () => {
    renderProfile(companyDetail({ viewer: { isMember: false } as ViewerContext }));

    await screen.findByTestId('tab-content');
    expect(screen.queryByRole('link', { name: 'Manage' })).not.toBeInTheDocument();
  });

  it('offers the dashboard to a member who holds something it shows', async () => {
    auth.isAuthenticated = true;
    renderProfile(
      companyDetail({
        viewer: {
          isMember: true,
          roles: ['recruiter_admin'],
          permissions: ['company:view', 'team:view'],
        } as ViewerContext,
      })
    );

    await screen.findByTestId('tab-content');
    expect(await screen.findByRole('link', { name: 'Manage' })).toHaveAttribute(
      'href',
      '/company/dashboard?company=northwind-logistics'
    );
  });

  it('gives a member with no dashboard permission no dashboard link', async () => {
    auth.isAuthenticated = true;
    renderProfile(
      companyDetail({
        viewer: {
          isMember: true,
          roles: ['employee'],
          permissions: ['company:view'],
        } as ViewerContext,
      })
    );

    await screen.findByTestId('tab-content');
    expect(screen.queryByRole('link', { name: 'Manage' })).not.toBeInTheDocument();
  });

  it('marks an outbound website link so it carries no ranking weight', async () => {
    renderProfile(companyDetail({ website: 'https://northwind.example' }));

    await screen.findByTestId('tab-content');
    const link = screen.getByRole('link', { name: 'Website' });
    expect(link).toHaveAttribute('href', 'https://northwind.example');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
