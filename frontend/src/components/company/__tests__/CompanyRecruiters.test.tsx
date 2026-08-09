import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyRecruiters from '../CompanyRecruiters';
import { renderWithProviders } from '../../../test/utils';
import { membership, page, person } from '../../../test/fixtures';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getRecruiters: vi.fn(),
    getDepartments: vi.fn(),
    inviteRecruiter: vi.fn(),
    setRecruiterSuspended: vi.fn(),
    removeRecruiter: vi.fn(),
    getPermissionCatalog: vi.fn(),
    setMemberPermissions: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const owner = membership(
  ['company_owner'],
  [
    'company:view',
    'recruiter:view',
    'recruiter:invite',
    'recruiter:manage',
    'permission:edit',
    'analytics:view',
  ]
);

// A hiring manager can see who recruits for the company without being able to
// change the roster.
const viewerOnly = membership(['hiring_manager'], ['company:view', 'recruiter:view']);

const recruiter = (overrides = {}) =>
  person({
    id: 'member-5',
    userId: 'user-5',
    name: 'Ravi Menon',
    jobTitle: 'Senior Recruiter',
    role: 'recruiter',
    roles: ['recruiter'],
    associationType: 'recruiter',
    ...overrides,
  });

describe('CompanyRecruiters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDepartments.mockResolvedValue([]);
    api.setRecruiterSuspended.mockResolvedValue(undefined as never);
    api.removeRecruiter.mockResolvedValue(undefined as never);
  });

  it('lists the recruiting team the server returned', async () => {
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    const table = await screen.findByRole('table', { name: 'Recruiting team' });
    const row = within(table).getByRole('row', { name: /Ravi Menon/ });
    expect(within(row).getByText('Ravi Menon')).toBeInTheDocument();
    expect(within(row).getByText('Recruiter')).toBeInTheDocument();
    expect(api.getRecruiters).toHaveBeenCalledWith('company-1', {});
  });

  it('offers no roster controls to a member who may only see the team', async () => {
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={viewerOnly} />);

    await screen.findByText('Ravi Menon');
    expect(screen.queryByRole('button', { name: 'Invite recruiter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Ravi Menon' })).not.toBeInTheDocument();
  });

  it('does not link to analytics for someone who may not read them', async () => {
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={viewerOnly} />);

    await screen.findByText('Ravi Menon');
    expect(
      screen.queryByRole('link', { name: 'See what each recruiter has done' })
    ).not.toBeInTheDocument();
  });

  it('links a permitted member to the company analytics screen', async () => {
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    expect(
      await screen.findByRole('link', { name: 'See what each recruiter has done' })
    ).toHaveAttribute('href', '/company/dashboard/analytics');
  });

  it('suspends a recruiter’s access to the company', async () => {
    const user = userEvent.setup();
    api.getRecruiters.mockResolvedValue(page([recruiter({ status: 'approved' })]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Ravi Menon' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Suspend access' }));

    await waitFor(() =>
      expect(api.setRecruiterSuspended).toHaveBeenCalledWith('company-1', 'member-5', true)
    );
    expect(
      await screen.findByText('Ravi Menon can no longer act for this company.')
    ).toBeInTheDocument();
  });

  it('reinstates a suspended recruiter', async () => {
    const user = userEvent.setup();
    api.getRecruiters.mockResolvedValue(page([recruiter({ status: 'suspended' })]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Ravi Menon' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Reinstate' }));

    await waitFor(() =>
      expect(api.setRecruiterSuspended).toHaveBeenCalledWith('company-1', 'member-5', false)
    );
  });

  // Removing someone from the recruiting team ends the company's side of the
  // relationship. The jobs and applications belong to the company and the
  // recruiter's own profile belongs to them, so neither is touched.
  it('says what removal leaves behind before removing', async () => {
    const user = userEvent.setup();
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Ravi Menon' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from recruiting team' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Jobs they already posted and the applications on them stay/)
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(api.removeRecruiter).toHaveBeenCalledWith('company-1', 'member-5')
    );
  });

  it('hides the permission editor from a manager without permission:edit', async () => {
    const user = userEvent.setup();
    const recruiterAdmin = membership(
      ['recruiter_admin'],
      ['company:view', 'recruiter:view', 'recruiter:manage']
    );
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={recruiterAdmin} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Ravi Menon' }));

    expect(
      await screen.findByRole('menuitem', { name: 'Remove from recruiting team' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Adjust permissions' })).not.toBeInTheDocument();
  });

  it('asks the server for the filtered role', async () => {
    const user = userEvent.setup();
    api.getRecruiters.mockResolvedValue(page([recruiter()]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);
    await screen.findByText('Ravi Menon');

    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(await screen.findByRole('option', { name: 'Hiring Manager' }));

    await waitFor(() =>
      expect(api.getRecruiters).toHaveBeenCalledWith('company-1', { role: 'hiring_manager' })
    );
  });

  it('says the roster is empty rather than showing nothing at all', async () => {
    api.getRecruiters.mockResolvedValue(page([]) as never);

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    expect(
      await screen.findByText('No one holds a recruiting role at this company yet.')
    ).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    api.getRecruiters.mockRejectedValue(new Error('The recruiting team could not be loaded.'));

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The recruiting team could not be loaded.'
    );
  });
});
