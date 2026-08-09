import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyTeam from '../CompanyTeam';
import { renderWithProviders } from '../../../test/utils';
import { membership, page, person } from '../../../test/fixtures';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getTeam: vi.fn(),
    getDepartments: vi.fn(),
    decideAssociation: vi.fn(),
    inviteTeamMember: vi.fn(),
    updateTeamMember: vi.fn(),
    removeTeamMember: vi.fn(),
    setMemberPermissions: vi.fn(),
    getPermissionCatalog: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const owner = membership(
  ['company_owner'],
  [
    'company:view',
    'company:edit',
    'team:view',
    'team:invite',
    'team:manage',
    'people:approve',
    'permission:edit',
  ]
);

// A recruiter admin can read the team and nothing more: the role holds
// `team:view` without `team:manage`, `people:approve` or `permission:edit`.
const reader = membership(['recruiter_admin'], ['company:view', 'team:view']);

describe('CompanyTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDepartments.mockResolvedValue([]);
    api.decideAssociation.mockResolvedValue(undefined as never);
    api.removeTeamMember.mockResolvedValue(undefined as never);
    api.updateTeamMember.mockResolvedValue(undefined as never);
  });

  it('lists the members the server returned', async () => {
    api.getTeam.mockResolvedValue(
      page([
        person({ id: 'member-1', name: 'Amina Farouk', email: 'amina@northwind.example' }),
        person({ id: 'member-2', userId: 'user-2', name: 'Ravi Menon', jobTitle: 'Recruiter' }),
      ]) as never
    );

    renderWithProviders(<CompanyTeam membership={owner} />);

    const table = await screen.findByRole('table', { name: 'Company team' });
    expect(within(table).getByText('Amina Farouk')).toBeInTheDocument();
    expect(within(table).getByText('Ravi Menon')).toBeInTheDocument();
    expect(api.getTeam).toHaveBeenCalledWith('company-1', { page: 1, limit: 20 });
  });

  // Email is on the row only because the server put it there, and the server
  // only does that for a caller holding team:view. The row renders whatever it
  // was given, so the absent case has to render nothing rather than a blank
  // separator or the string "undefined".
  it('shows an email only when the response carried one', async () => {
    api.getTeam.mockResolvedValue(
      page([
        person({ id: 'member-1', name: 'Amina Farouk', email: 'amina@northwind.example' }),
        person({ id: 'member-2', userId: 'user-2', name: 'Ravi Menon', jobTitle: 'Recruiter' }),
      ]) as never
    );

    renderWithProviders(<CompanyTeam membership={owner} />);

    expect(
      await screen.findByText('Operations Lead · amina@northwind.example')
    ).toBeInTheDocument();
    expect(screen.getByText('Recruiter', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('offers no management controls to a member who may only read the team', async () => {
    api.getTeam.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyTeam membership={reader} />);

    await screen.findByText('Amina Farouk');
    expect(screen.queryByRole('button', { name: 'Invite member' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Amina Farouk' })
    ).not.toBeInTheDocument();
    // Departments back the invite dialog's picker, so a reader never asks for them.
    expect(api.getDepartments).not.toHaveBeenCalled();
  });

  it('leaves a pending request undecided for a member without people:approve', async () => {
    api.getTeam.mockResolvedValue(
      page([person({ name: 'Amina Farouk', status: 'pending' })]) as never
    );

    renderWithProviders(<CompanyTeam membership={reader} />);

    await screen.findByText('Amina Farouk');
    expect(
      screen.queryByRole('button', { name: 'Approve Amina Farouk' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject Amina Farouk' })).not.toBeInTheDocument();
  });

  it('approves a pending association for a member who may decide', async () => {
    const user = userEvent.setup();
    api.getTeam.mockResolvedValue(
      page([person({ id: 'member-9', name: 'Amina Farouk', status: 'pending' })]) as never
    );

    renderWithProviders(<CompanyTeam membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Approve Amina Farouk' }));

    await waitFor(() =>
      expect(api.decideAssociation).toHaveBeenCalledWith('company-1', 'member-9', 'approve')
    );
    expect(await screen.findByText('Amina Farouk was approved as a member.')).toBeInTheDocument();
  });

  it('rejects a pending association without approving it', async () => {
    const user = userEvent.setup();
    api.getTeam.mockResolvedValue(
      page([person({ id: 'member-9', name: 'Amina Farouk', status: 'pending' })]) as never
    );

    renderWithProviders(<CompanyTeam membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Reject Amina Farouk' }));

    await waitFor(() =>
      expect(api.decideAssociation).toHaveBeenCalledWith('company-1', 'member-9', 'reject')
    );
  });

  // The role picker mirrors Grant.CanAssign: a recruiter admin may hand out
  // roles below their own and nothing at or above it. Offering more would only
  // produce a request the server refuses.
  it('offers a manager only the roles below their own', async () => {
    const user = userEvent.setup();
    const recruiterAdmin = membership(
      ['recruiter_admin'],
      ['company:view', 'team:view', 'team:manage']
    );
    api.getTeam.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyTeam membership={recruiterAdmin} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Amina Farouk' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Change role or department' }));

    await user.click(await screen.findByRole('combobox', { name: 'Role' }));
    const options = await screen.findAllByRole('option');
    const labels = options.map((option) => option.textContent);

    expect(labels).toEqual(['Hiring Manager', 'Recruiter', 'Employee', 'Viewer']);
    expect(labels).not.toContain('Company Owner');
    expect(labels).not.toContain('Organization Admin');
    expect(labels).not.toContain('Recruiter Admin');
  });

  it('hides the permission editor from a manager without permission:edit', async () => {
    const user = userEvent.setup();
    const recruiterAdmin = membership(
      ['recruiter_admin'],
      ['company:view', 'team:view', 'team:manage']
    );
    api.getTeam.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyTeam membership={recruiterAdmin} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Amina Farouk' }));

    expect(await screen.findByRole('menuitem', { name: 'Remove from company' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Adjust permissions' })).not.toBeInTheDocument();
  });

  it('states what removal does and does not touch before removing', async () => {
    const user = userEvent.setup();
    api.getTeam.mockResolvedValue(
      page([person({ id: 'member-4', name: 'Amina Farouk' })]) as never
    );

    renderWithProviders(<CompanyTeam membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Amina Farouk' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from company' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Remove Amina Farouk\?/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/profile, applications and messages are untouched/i)
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(api.removeTeamMember).toHaveBeenCalledWith('company-1', 'member-4')
    );
  });

  it('keeps the member when the removal is cancelled', async () => {
    const user = userEvent.setup();
    api.getTeam.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyTeam membership={owner} />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Amina Farouk' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from company' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' })
    );

    expect(api.removeTeamMember).not.toHaveBeenCalled();
  });

  it('sends the status filter to the server rather than filtering the page it has', async () => {
    const user = userEvent.setup();
    api.getTeam.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyTeam membership={owner} />);
    await screen.findByText('Amina Farouk');

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Awaiting approval' }));

    await waitFor(() =>
      expect(api.getTeam).toHaveBeenCalledWith('company-1', {
        page: 1,
        limit: 20,
        status: 'pending',
      })
    );
  });

  it('reports a failed load instead of showing an empty team', async () => {
    api.getTeam.mockRejectedValue(new Error('The team could not be loaded.'));

    renderWithProviders(<CompanyTeam membership={owner} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The team could not be loaded.');
  });

  it('says so when no member matches the filters', async () => {
    api.getTeam.mockResolvedValue(page([]) as never);

    renderWithProviders(<CompanyTeam membership={owner} />);

    expect(await screen.findByText('No members match these filters.')).toBeInTheDocument();
  });
});
