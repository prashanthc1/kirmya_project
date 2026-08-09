import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';

import CompanyDashboard from '../CompanyDashboard';
import { renderWithProviders } from '../../../test/utils';
import { CompanyPermission } from '../../../features/company/types';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getDashboard: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const dashboard = (overrides: Record<string, unknown> = {}) =>
  ({
    profileCompletion: 64,
    verificationStatus: 'not_verified',
    profileViews: 4820,
    jobViews: 2400,
    activeJobs: 6,
    applications: 120,
    candidates: 98,
    interviews: 30,
    hires: 6,
    followers: 1280,
    pendingApprovals: 0,
    recruiterActivity: [],
    ...overrides,
  }) as never;

/** A `can` that answers yes only for the permissions given. */
const allow = (...permissions: CompanyPermission[]) => (permission: CompanyPermission) =>
  permissions.includes(permission);

const render = (can: (permission: CompanyPermission) => boolean) =>
  renderWithProviders(
    <CompanyDashboard companyId="company-1" slug="northwind-logistics" can={can} />
  );

describe('CompanyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the counts the server computed', async () => {
    api.getDashboard.mockResolvedValue(dashboard());

    render(allow('company:view'));

    expect(await screen.findByText('4,820')).toBeInTheDocument();
    expect(screen.getByText('2,400')).toBeInTheDocument();
    expect(screen.getByText('1,280')).toBeInTheDocument();
    expect(screen.getByText('Distinct people who applied')).toBeInTheDocument();
  });

  // Nothing on this screen can make a company verified, and an unverified
  // company is told plainly who decides.
  it('says an administrator decides verification', async () => {
    api.getDashboard.mockResolvedValue(dashboard({ verificationStatus: 'not_verified' }));

    render(allow('company:view', 'verification:submit'));

    expect(
      await screen.findByText(
        /Kirmya administrators review the documents; the badge appears only after they approve\./
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/company/dashboard/verification?company=northwind-logistics'
    );
  });

  it('does not prompt someone who cannot submit a verification', async () => {
    api.getDashboard.mockResolvedValue(dashboard({ verificationStatus: 'not_verified' }));

    render(allow('company:view'));

    await screen.findByText('4,820');
    expect(screen.queryByText(/Kirmya administrators review the documents/)).not.toBeInTheDocument();
  });

  it('drops the verification prompt once the company is verified', async () => {
    api.getDashboard.mockResolvedValue(dashboard({ verificationStatus: 'verified' }));

    render(allow('company:view', 'verification:submit'));

    await screen.findByText('4,820');
    expect(screen.queryByText(/Kirmya administrators review the documents/)).not.toBeInTheDocument();
  });

  // Each shortcut is a link into a screen the viewer is allowed to open. A
  // permission they do not hold produces no link at all rather than a link that
  // fails.
  it('offers only the shortcuts the viewer’s permissions cover', async () => {
    api.getDashboard.mockResolvedValue(dashboard());

    render(allow('company:view', 'job:view'));

    expect(await screen.findByRole('link', { name: 'Jobs' })).toHaveAttribute(
      'href',
      '/company/dashboard/jobs?company=northwind-logistics'
    );
    expect(screen.queryByRole('link', { name: 'People' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit profile' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage recruiters' })).not.toBeInTheDocument();
  });

  it('offers every shortcut to a viewer who holds every permission', async () => {
    api.getDashboard.mockResolvedValue(dashboard());

    render(allow('company:view', 'company:edit', 'job:view', 'team:view', 'analytics:view', 'recruiter:view'));

    expect(await screen.findByRole('link', { name: 'Jobs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute(
      'href',
      '/company/dashboard/profile?company=northwind-logistics'
    );
    expect(screen.getByRole('link', { name: 'Manage recruiters' })).toBeInTheDocument();
  });

  it('raises pending association requests only to someone who may decide them', async () => {
    api.getDashboard.mockResolvedValue(dashboard({ pendingApprovals: 3 }));

    const { unmount } = render(allow('company:view'));
    await screen.findByText('4,820');
    expect(screen.queryByText(/waiting for a decision/)).not.toBeInTheDocument();
    unmount();

    render(allow('company:view', 'people:approve'));
    expect(await screen.findByText(/3 people are waiting for a decision/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
      'href',
      '/company/dashboard/people?company=northwind-logistics&status=pending'
    );
  });

  it('says no recruiter activity was recorded rather than showing an empty table', async () => {
    api.getDashboard.mockResolvedValue(dashboard({ recruiterActivity: [] }));

    render(allow('company:view'));

    expect(
      await screen.findByText('No recruiter activity has been recorded for this company yet.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lists recruiter activity against the recruiter who did it', async () => {
    api.getDashboard.mockResolvedValue(
      dashboard({
        recruiterActivity: [
          {
            userId: 'user-5',
            name: 'Ravi Menon',
            jobsPosted: 4,
            applicationsReviewed: 88,
            interviews: 12,
            hires: 3,
          },
        ],
      })
    );

    render(allow('company:view'));

    const table = await screen.findByRole('table', { name: 'Recruiter activity' });
    const row = within(table).getByRole('row', { name: /Ravi Menon/ });
    expect(within(row).getByText('88')).toBeInTheDocument();
  });

  it('reports a failed load instead of a dashboard full of zeroes', async () => {
    api.getDashboard.mockRejectedValue(new Error('The dashboard could not be loaded.'));

    render(allow('company:view'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The dashboard could not be loaded.'
    );
    expect(screen.queryByText('Profile completion')).not.toBeInTheDocument();
  });
});
