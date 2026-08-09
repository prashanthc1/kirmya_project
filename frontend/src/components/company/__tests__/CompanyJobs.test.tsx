import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyJobs from '../CompanyJobs';
import { renderWithProviders } from '../../../test/utils';
import { job, page } from '../../../test/fixtures';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getJobs: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

describe('CompanyJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The company module lists the platform's own job rows and links to the
  // screens that own them. Every destination here belongs to the Jobs or
  // recruiter module, which is what keeps this from becoming a second jobs board.
  it('links a public card to the shared job page', async () => {
    api.getJobs.mockResolvedValue(
      page([job({ id: 'job-42', title: 'Warehouse Supervisor' })]) as never
    );

    renderWithProviders(<CompanyJobs identifier="northwind-logistics" />);

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('link', { name: 'Warehouse Supervisor' })).toHaveAttribute(
      'href',
      '/jobs/job-42'
    );
    expect(within(card).getByRole('link', { name: 'View job' })).toHaveAttribute(
      'href',
      '/jobs/job-42'
    );
  });

  it('links a management card into the existing recruiter screens', async () => {
    api.getJobs.mockResolvedValue(
      page([job({ id: 'job-42', title: 'Warehouse Supervisor' })]) as never
    );

    renderWithProviders(<CompanyJobs identifier="company-1" variant="manage" />);

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('link', { name: 'Applications' })).toHaveAttribute(
      'href',
      '/recruiter/applications/job-42'
    );
    // The management card is not itself a link to the public page.
    expect(within(card).queryByRole('link', { name: 'View job' })).not.toBeInTheDocument();
  });

  it('shows traffic and status only on the management card', async () => {
    api.getJobs.mockResolvedValue(
      page([job({ status: 'draft', viewsCount: 1200, applicationsCount: 34 })]) as never
    );

    const { unmount } = renderWithProviders(<CompanyJobs identifier="northwind-logistics" />);
    await screen.findByRole('article');
    expect(screen.queryByText(/views/)).not.toBeInTheDocument();
    expect(screen.queryByText('draft')).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<CompanyJobs identifier="company-1" variant="manage" />);
    const card = await screen.findByRole('article');
    expect(within(card).getByText('1,200 views')).toBeInTheDocument();
    expect(within(card).getByText('34 applications')).toBeInTheDocument();
    expect(within(card).getByText('draft')).toBeInTheDocument();
  });

  it('offers job analytics only to a caller who may see them', async () => {
    const user = userEvent.setup();
    const onViewAnalytics = vi.fn();
    api.getJobs.mockResolvedValue(page([job({ id: 'job-42' })]) as never);

    const { unmount } = renderWithProviders(
      <CompanyJobs identifier="company-1" variant="manage" onViewAnalytics={onViewAnalytics} />
    );
    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <CompanyJobs
        identifier="company-1"
        variant="manage"
        canViewJobAnalytics
        onViewAnalytics={onViewAnalytics}
      />
    );
    await user.click(await screen.findByRole('button', { name: 'Analytics' }));
    expect(onViewAnalytics).toHaveBeenCalledWith(expect.objectContaining({ id: 'job-42' }));
  });

  // The status filter is a convenience on a management view. A public view has
  // no filter at all, because what an anonymous visitor may see is decided by
  // the server and not by a select box.
  it('offers the status filter only on the management view', async () => {
    api.getJobs.mockResolvedValue(page([job()]) as never);

    const { unmount } = renderWithProviders(<CompanyJobs identifier="northwind-logistics" />);
    await screen.findByRole('article');
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<CompanyJobs identifier="company-1" variant="manage" />);
    expect(await screen.findByRole('combobox', { name: 'Status' })).toBeInTheDocument();
  });

  it('asks the server for the filtered status', async () => {
    const user = userEvent.setup();
    api.getJobs.mockResolvedValue(page([job()]) as never);

    renderWithProviders(<CompanyJobs identifier="company-1" variant="manage" pageSize={10} />);
    await screen.findByRole('article');

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Closed' }));

    await waitFor(() =>
      expect(api.getJobs).toHaveBeenCalledWith('company-1', {
        page: 1,
        limit: 10,
        status: 'closed',
      })
    );
  });

  it('uses the empty message the host page supplied', async () => {
    api.getJobs.mockResolvedValue(page([]) as never);

    renderWithProviders(
      <CompanyJobs
        identifier="northwind-logistics"
        emptyMessage="Northwind Logistics is not hiring on Kirmya right now."
      />
    );

    expect(
      await screen.findByText('Northwind Logistics is not hiring on Kirmya right now.')
    ).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    api.getJobs.mockRejectedValue(new Error('Jobs could not be loaded.'));

    renderWithProviders(<CompanyJobs identifier="northwind-logistics" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Jobs could not be loaded.');
  });
});
