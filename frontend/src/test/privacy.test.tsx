import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PrivacyCenter from '../components/privacy/PrivacyCenter';
import CookieConsentBanner from '../components/privacy/CookieConsentBanner';
import ConsentHistoryView from '../components/privacy/ConsentHistoryView';
import DataExportView from '../components/privacy/DataExportView';
import AdminPrivacyDashboard from '../components/privacy/AdminPrivacyDashboard';

describe('Privacy & Data Protection Components Test Suite', () => {
  it('renders PrivacyCenter with full tabbed controls', () => {
    render(<PrivacyCenter />);
    expect(screen.getByText(/Centralized Privacy & Data Protection Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Visibility & Discovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Cookie Preferences/i)).toBeInTheDocument();
  });

  it('renders CookieConsentBanner when no consent recorded', () => {
    localStorage.clear();
    render(<CookieConsentBanner />);
    expect(screen.getByText(/We Value Your Privacy & Choice/i)).toBeInTheDocument();
    expect(screen.getByText(/Accept All/i)).toBeInTheDocument();
  });

  it('renders ConsentHistoryView with historical audit items', () => {
    render(<ConsentHistoryView />);
    expect(screen.getByText(/Consent History Audit Log/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });

  it('renders DataExportView for requesting SAR archive', () => {
    render(<DataExportView />);
    expect(screen.getByText(/Download My Personal Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Data Export Archive/i)).toBeInTheDocument();
  });

  it('renders AdminPrivacyDashboard executive console', () => {
    render(<AdminPrivacyDashboard />);
    expect(screen.getByText(/Executive Privacy & Data Protection Console/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Subject Access Requests/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Pending SARs/i)).toBeInTheDocument();
  });
});
