import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
import AdminPrivacyDashboard from '../components/privacy/AdminPrivacyDashboard';

describe('Legal, Privacy & Compliance Module Test Suite', () => {
  it('renders LegalDocumentViewer', () => {
    render(<LegalDocumentViewer title="Terms of Service" slug="terms" />);
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });

  it('renders ConsentBanner cookie notification', () => {
    render(<ConsentBanner onAcceptAll={() => {}} onRejectNonEssential={() => {}} onOpenPreferences={() => {}} />);
    expect(screen.getByText(/Cookie Preferences/i)).toBeInTheDocument();
  });

  it('renders PrivacyCenter settings dashboard', () => {
    render(<PrivacyCenter />);
    expect(screen.getByText(/Privacy & Data Rights Center/i)).toBeInTheDocument();
  });

  it('renders ConsentHistoryView table', () => {
    render(<ConsentHistoryView />);
    expect(screen.getByText(/Policy Acceptance & Consent History/i)).toBeInTheDocument();
  });

  it('renders DataExportView workflow', () => {
    render(<DataExportView />);
    expect(screen.getByText(/Download Account Data Archive/i)).toBeInTheDocument();
  });

  it('renders AccountDeletionModal warning dialog', () => {
    render(<AccountDeletionModal open={true} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText(/Permanent Account Deletion/i)).toBeInTheDocument();
  });

  it('renders AdminPrivacyDashboard executive console', () => {
    render(<AdminPrivacyDashboard />);
    expect(screen.getByText(/Executive Privacy & Data Protection Console/i)).toBeInTheDocument();
  });
});
