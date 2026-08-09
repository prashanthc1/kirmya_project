import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyVerification from '../CompanyVerification';
import { renderWithProviders } from '../../../test/utils';
import { VerificationStatus } from '../../../features/company/types';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getVerification: vi.fn(),
    submitVerification: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const state = (status: VerificationStatus, verification: Record<string, unknown> | null = null) =>
  ({ status, verification }) as never;

const fillRegistration = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Registered legal name/), 'Northwind Logistics FZE');
  await user.type(screen.getByLabelText(/Registration number/), 'FZE-119284');
  await user.type(screen.getByLabelText(/Country of registration/), 'United Arab Emirates');
  await user.type(screen.getByLabelText(/Contact email/), 'legal@northwind.example');
};

describe('CompanyVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.submitVerification.mockResolvedValue(undefined as never);
  });

  // The badge is an administrator's decision. Nothing this component does may
  // present the company as verified, and a successful submit is worded as a
  // request rather than an outcome.
  it('submitting does not make the company verified', async () => {
    const user = userEvent.setup();
    api.getVerification.mockResolvedValue(state('not_verified'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    expect(await screen.findByText('Not verified')).toBeInTheDocument();

    await fillRegistration(user);
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://northwind.example/docs/registration.pdf'
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    await waitFor(() => expect(api.submitVerification).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        'Submitted for review. Nothing changes on the public page until an administrator approves it.'
      )
    ).toBeInTheDocument();

    // The status still comes from the server, which has not approved anything.
    expect(screen.getByText('Not verified')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('sends the registration details and the document link', async () => {
    const user = userEvent.setup();
    api.getVerification.mockResolvedValue(state('not_verified'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);
    await screen.findByText('Not verified');

    await fillRegistration(user);
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://northwind.example/docs/registration.pdf'
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    await waitFor(() =>
      expect(api.submitVerification).toHaveBeenCalledWith('company-1', {
        legalName: 'Northwind Logistics FZE',
        registrationNumber: 'FZE-119284',
        registrationCountry: 'United Arab Emirates',
        contactEmail: 'legal@northwind.example',
        documents: [
          {
            documentType: 'business_registration',
            fileUrl: 'https://northwind.example/docs/registration.pdf',
            fileName: 'registration.pdf',
            mimeType: 'application/pdf',
          },
        ],
      })
    );
  });

  it('refuses a submission with no usable document link', async () => {
    const user = userEvent.setup();
    api.getVerification.mockResolvedValue(state('not_verified'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);
    await screen.findByText('Not verified');

    await fillRegistration(user);
    await user.type(screen.getByLabelText('Document URL'), 'https://northwind.example/docs/notes.txt');
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    expect(
      await screen.findByText('Link to a PDF, PNG or JPEG document')
    ).toBeInTheDocument();
    expect(api.submitVerification).not.toHaveBeenCalled();
  });

  it('refuses a submission whose registration details do not hold up', async () => {
    const user = userEvent.setup();
    api.getVerification.mockResolvedValue(state('not_verified'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);
    await screen.findByText('Not verified');

    // Every field is filled, so the browser's own required-field check passes
    // and what rejects this is the schema: a one-character legal name is not a
    // registered name.
    await user.type(screen.getByLabelText(/Registered legal name/), 'N');
    await user.type(screen.getByLabelText(/Registration number/), 'FZE-119284');
    await user.type(screen.getByLabelText(/Country of registration/), 'United Arab Emirates');
    await user.type(screen.getByLabelText(/Contact email/), 'legal@northwind.example');
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://northwind.example/docs/registration.pdf'
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    expect(await screen.findByText('Enter the registered legal name')).toBeInTheDocument();
    expect(api.submitVerification).not.toHaveBeenCalled();
  });

  it('lets a reviewer-in-progress submission stand rather than resubmitting over it', async () => {
    api.getVerification.mockResolvedValue(state('pending', { submittedAt: '2024-11-01T09:00:00Z' }));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    expect(await screen.findByText('Under review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A review is already in progress' })).toBeDisabled();
  });

  it('shows the reviewer note when the claim was not approved', async () => {
    api.getVerification.mockResolvedValue(
      state('rejected', {
        submittedAt: '2024-11-01T09:00:00Z',
        reviewedAt: '2024-11-04T09:00:00Z',
        rejectionReason: 'The registration number did not match the certificate.',
        legalName: 'Northwind Logistics FZE',
        registrationNumber: 'FZE-000000',
        registrationCountry: 'United Arab Emirates',
        contactEmail: 'legal@northwind.example',
        documents: [],
      })
    );

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    expect(await screen.findByText('Not approved')).toBeInTheDocument();
    expect(
      screen.getByText(/The registration number did not match the certificate\./)
    ).toBeInTheDocument();
    // The previous claim is prefilled so it is corrected rather than retyped.
    expect(screen.getByLabelText(/Registered legal name/)).toHaveValue('Northwind Logistics FZE');
  });

  it('reports an approved verification as the administrator’s decision', async () => {
    api.getVerification.mockResolvedValue(
      state('verified', {
        submittedAt: '2024-09-01T09:00:00Z',
        reviewedAt: '2024-09-08T09:00:00Z',
        expiresAt: '2026-09-08T09:00:00Z',
        documents: [],
      })
    );

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(
      screen.getByText(/An administrator approved this company\./)
    ).toBeInTheDocument();
  });

  it('shows the status but no form to a member who may not submit', async () => {
    api.getVerification.mockResolvedValue(state('not_verified'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit={false} />);

    expect(await screen.findByText('Not verified')).toBeInTheDocument();
    expect(
      screen.getByText(/You can see the verification status but not submit one\./)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit for review' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Document URL')).not.toBeInTheDocument();
  });

  it('surfaces a rejected submission instead of reporting success', async () => {
    const user = userEvent.setup();
    api.getVerification.mockResolvedValue(state('not_verified'));
    api.submitVerification.mockRejectedValue(new Error('That registration number is already used'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);
    await screen.findByText('Not verified');

    await fillRegistration(user);
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://northwind.example/docs/registration.pdf'
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    expect(
      await screen.findByText('That registration number is already used')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Submitted for review/)).not.toBeInTheDocument();
  });
});
