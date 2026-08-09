import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyPermissions from '../CompanyPermissions';
import { renderWithProviders } from '../../../test/utils';
import { person } from '../../../test/fixtures';
import { CompanyPermission, RoleDescriptor } from '../../../features/company/types';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getPermissionCatalog: vi.fn(),
    setMemberPermissions: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

// A trimmed catalogue. The real one has seven roles and thirty permissions; the
// point being tested is the relationship between what a role carries, what the
// actor holds and what the checkbox does, and four permissions show that as
// well as thirty.
const catalog: RoleDescriptor[] = [
  {
    role: 'company_owner',
    rank: 0,
    permissions: ['company:view', 'company:edit', 'analytics:view', 'job:view', 'permission:edit'],
  },
  { role: 'recruiter_admin', rank: 2, permissions: ['company:view', 'job:view'] },
  { role: 'employee', rank: 5, permissions: ['company:view'] },
];

const checkbox = (label: string) =>
  screen.getByRole('checkbox', { name: new RegExp(label, 'i') });

describe('CompanyPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPermissionCatalog.mockResolvedValue(catalog as never);
    api.setMemberPermissions.mockResolvedValue(undefined as never);
  });

  it('shows what the role already carries as fixed context', async () => {
    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({ role: 'employee', roles: ['employee'] })}
        actorPermissions={['company:view', 'company:edit', 'permission:edit', 'analytics:view']}
        onClose={vi.fn()}
      />
    );

    const fromRole = await screen.findByRole('checkbox', { name: /Company · View/i });
    expect(fromRole).toBeChecked();
    expect(fromRole).toBeDisabled();
    expect(screen.getByText('From role')).toBeInTheDocument();
  });

  // The escalation case. `job:view` is in the catalogue and the member does not
  // have it, but the acting recruiter admin does not hold it either, so it must
  // not be grantable. The server refuses the same grant; the dialog refuses to
  // ask.
  it('will not let an actor grant a permission they do not hold', async () => {
    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({ role: 'employee', roles: ['employee'] })}
        actorPermissions={['company:view', 'team:view', 'permission:edit']}
        onClose={vi.fn()}
      />
    );

    await screen.findByRole('checkbox', { name: /Company · View/i });

    expect(checkbox('Job · View')).toBeDisabled();
    expect(checkbox('Analytics · View')).toBeDisabled();
    expect(checkbox('Company · Edit')).toBeDisabled();
    expect(
      screen.getAllByLabelText('You do not hold this permission, so you cannot grant it').length
    ).toBeGreaterThan(0);
  });

  it('lets an actor grant a permission they do hold', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({ id: 'member-7', role: 'employee', roles: ['employee'] })}
        actorPermissions={['company:view', 'analytics:view', 'permission:edit']}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    const grantable = await screen.findByRole('checkbox', { name: /Analytics · View/i });
    expect(grantable).toBeEnabled();
    expect(grantable).not.toBeChecked();

    await user.click(grantable);
    await user.click(screen.getByRole('button', { name: /Save 1 extra/ }));

    await waitFor(() =>
      expect(api.setMemberPermissions).toHaveBeenCalledWith('company-1', 'member-7', [
        'analytics:view',
      ])
    );
    expect(onSaved).toHaveBeenCalledWith('Amina Farouk');
    expect(onClose).toHaveBeenCalled();
  });

  // Saving replaces the extras outright, so what goes to the server is the
  // whole list and not a diff — a permission left ticked has to still be in it.
  it('sends the whole extra list, not the change', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({
          id: 'member-7',
          role: 'employee',
          roles: ['employee'],
          extraPermissions: ['job:view'] as CompanyPermission[],
        })}
        actorPermissions={['company:view', 'job:view', 'analytics:view', 'permission:edit']}
        onClose={vi.fn()}
      />
    );

    const existing = await screen.findByRole('checkbox', { name: /Job · View/i });
    expect(existing).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: /Analytics · View/i }));
    await user.click(screen.getByRole('button', { name: /Save 2 extra/ }));

    await waitFor(() => expect(api.setMemberPermissions).toHaveBeenCalledTimes(1));
    const [, , sent] = api.setMemberPermissions.mock.calls[0] as [string, string, string[]];
    expect([...sent].sort()).toEqual(['analytics:view', 'job:view']);
  });

  // Removing the last extra has to send an empty list. Sending nothing at all
  // would leave the grant in place.
  it('sends an empty list when the last extra is removed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({
          id: 'member-7',
          role: 'employee',
          roles: ['employee'],
          extraPermissions: ['job:view'] as CompanyPermission[],
        })}
        actorPermissions={['company:view', 'job:view', 'permission:edit']}
        onClose={vi.fn()}
      />
    );

    await user.click(await screen.findByRole('checkbox', { name: /Job · View/i }));
    await user.click(screen.getByRole('button', { name: /Save 0 extra/ }));

    await waitFor(() =>
      expect(api.setMemberPermissions).toHaveBeenCalledWith('company-1', 'member-7', [])
    );
  });

  // A permission the role already carries is not stored a second time, so it
  // never appears in the payload even though its box is ticked.
  it('never writes a role permission into the extras', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({ id: 'member-7', role: 'recruiter_admin', roles: ['recruiter_admin'] })}
        actorPermissions={['company:view', 'job:view', 'analytics:view', 'permission:edit']}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('checkbox', { name: /Job · View/i })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: /Analytics · View/i }));
    await user.click(screen.getByRole('button', { name: /Save 1 extra/ }));

    await waitFor(() =>
      expect(api.setMemberPermissions).toHaveBeenCalledWith('company-1', 'member-7', [
        'analytics:view',
      ])
    );
  });

  it('surfaces a refused save instead of closing as though it worked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    api.setMemberPermissions.mockRejectedValue(new Error('You cannot grant analytics:view'));

    renderWithProviders(
      <CompanyPermissions
        companyId="company-1"
        person={person({ id: 'member-7', role: 'employee', roles: ['employee'] })}
        actorPermissions={['company:view', 'analytics:view', 'permission:edit']}
        onClose={onClose}
      />
    );

    await user.click(await screen.findByRole('checkbox', { name: /Analytics · View/i }));
    await user.click(screen.getByRole('button', { name: /Save 1 extra/ }));

    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('You cannot grant analytics:view')
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
