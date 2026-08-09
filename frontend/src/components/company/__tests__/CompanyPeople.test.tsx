import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyPeople from '../CompanyPeople';
import { renderWithProviders } from '../../../test/utils';
import { page, person } from '../../../test/fixtures';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getPeople: vi.fn(),
    getDepartments: vi.fn(),
    requestAssociation: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const props = {
  identifier: 'northwind-logistics',
  companyId: 'company-1',
  companyName: 'Northwind Logistics',
};

describe('CompanyPeople', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDepartments.mockResolvedValue([]);
    api.requestAssociation.mockResolvedValue(undefined as never);
  });

  it('lists the people the server returned', async () => {
    api.getPeople.mockResolvedValue(
      page([
        person({ id: 'member-1', name: 'Amina Farouk' }),
        person({ id: 'member-2', userId: 'user-2', name: 'Ravi Menon' }),
      ]) as never
    );

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} />);

    expect(await screen.findByText('Amina Farouk')).toBeInTheDocument();
    expect(screen.getByText('Ravi Menon')).toBeInTheDocument();
    expect(screen.getByText('2 people listed publicly')).toBeInTheDocument();
  });

  // The public card is a fixed shape: name, title, department, association,
  // location. A response that happens to carry contact details — because the
  // same type serves the dashboard — must not put them on a public page.
  it('never renders contact details on the public card', async () => {
    api.getPeople.mockResolvedValue(
      page([
        person({
          name: 'Amina Farouk',
          email: 'amina@northwind.example',
          extraPermissions: ['analytics:view'],
        }),
      ]) as never
    );

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} />);

    await screen.findByText('Amina Farouk');
    expect(screen.queryByText(/amina@northwind\.example/)).not.toBeInTheDocument();
    expect(screen.queryByText(/analytics/i)).not.toBeInTheDocument();
  });

  // The component shows exactly the rows it was given. Whether an association is
  // public is decided on the server, so a person who kept theirs private simply
  // is not in the response and must not be inferred from anything else on screen.
  it('shows only the associations present in the response', async () => {
    api.getPeople.mockResolvedValue(
      page([person({ name: 'Amina Farouk' })], { total: 1 }) as never
    );

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} />);

    await screen.findByText('Amina Farouk');
    expect(screen.getByText('1 person listed publicly')).toBeInTheDocument();
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
  });

  it('says nobody is listed rather than implying the company is empty of people', async () => {
    api.getPeople.mockResolvedValue(page([]) as never);

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} />);

    expect(
      await screen.findByText('Nobody has publicly listed themselves at Northwind Logistics yet.')
    ).toBeInTheDocument();
  });

  it('sends an anonymous visitor to sign in before asking for an association', async () => {
    const user = userEvent.setup();
    const requireSignIn = vi.fn();
    api.getPeople.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(
      <CompanyPeople {...props} isAuthenticated={false} onRequireSignIn={requireSignIn} />
    );

    await screen.findByText('Amina Farouk');
    await user.click(screen.getByRole('button', { name: 'I work here' }));

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requestAssociation).not.toHaveBeenCalled();
  });

  it('does not offer the association form to someone who is already a member', async () => {
    api.getPeople.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyPeople {...props} isAuthenticated isMember />);

    await screen.findByText('Amina Farouk');
    expect(screen.queryByRole('button', { name: 'I work here' })).not.toBeInTheDocument();
  });

  it('filters on the server rather than hiding rows it already has', async () => {
    const user = userEvent.setup();
    api.getPeople.mockResolvedValue(page([person({ name: 'Amina Farouk' })]) as never);

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} pageSize={12} />);
    await screen.findByText('Amina Farouk');

    await user.click(screen.getByRole('combobox', { name: 'Association' }));
    await user.click(await screen.findByRole('option', { name: 'Former Employee' }));

    await waitFor(() =>
      expect(api.getPeople).toHaveBeenCalledWith('northwind-logistics', {
        page: 1,
        limit: 12,
        associationType: 'former_employee',
      })
    );
  });

  it('reports a failed load', async () => {
    api.getPeople.mockRejectedValue(new Error('People could not be loaded.'));

    renderWithProviders(<CompanyPeople {...props} isAuthenticated={false} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('People could not be loaded.');
  });
});
