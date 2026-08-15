import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    slug: 'terms',
  }),
}));

import LegalDocumentViewer from '../components/legal/LegalDocumentViewer';
import ConsentBanner from '../components/legal/ConsentBanner';
import PrivacyCenter from '../components/privacy/PrivacyCenter';
import ConsentHistoryView from '../components/privacy/ConsentHistoryView';
import DataExportView from '../components/privacy/DataExportView';
import AccountDeletionModal from '../components/privacy/AccountDeletionModal';
import CookieConsentBanner from '../components/privacy/CookieConsentBanner';
import AdminPrivacyDashboard from '../components/privacy/AdminPrivacyDashboard';

describe('Legal, Privacy & Compliance Module Test Suite', () => {
  it('renders LegalDocumentViewer', () => {
    render(<LegalDocumentViewer title="Terms of Service" slug="terms" />);
    expect(screen.getAllByText(/Terms/i).length).toBeGreaterThan(0);
  });

  it('renders ConsentBanner cookie notification', () => {
    render(<ConsentBanner onCustomize={() => {}} />);
    expect(screen.getByText(/Cookie & Privacy Preferences/i)).toBeInTheDocument();
  });

  it('renders CookieConsentBanner banner', () => {
    render(<CookieConsentBanner onOpenPreferences={() => {}} />);
    expect(screen.getByText(/We Value Your Privacy & Choice/i)).toBeInTheDocument();
  });

  it('renders PrivacyCenter settings dashboard', async () => {
    render(<PrivacyCenter />);
    expect(screen.getByText(/Centralized Privacy & Data Protection Center/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Quick Privacy Controls Summary/i)).toBeInTheDocument();
    });
  });

  it('renders ConsentHistoryView table', async () => {
    render(<ConsentHistoryView />);
    expect(screen.getByText(/Consent History & Regulatory Audit Log/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    });
  });

  it('renders DataExportView workflow', () => {
    render(<DataExportView />);
    expect(screen.getByText(/Download My Personal Data/i)).toBeInTheDocument();
  });

  it('renders AccountDeletionModal warning dialog', () => {
    render(<AccountDeletionModal open={true} onClose={() => {}} />);
    expect(screen.getAllByText(/Confirm Account Deletion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Confirm Account Password/i).length).toBeGreaterThan(0);
  });

  it('renders AdminPrivacyDashboard executive console', () => {
    render(<AdminPrivacyDashboard />);
    expect(screen.getByText(/Executive Privacy & Data Protection Console/i)).toBeInTheDocument();
  });
});
