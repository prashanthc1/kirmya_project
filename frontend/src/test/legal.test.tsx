import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConsentBanner from '../components/legal/ConsentBanner';
import LegalDocumentViewer from '../components/legal/LegalDocumentViewer';
import PrivacyRightsCenter from '../components/legal/PrivacyRightsCenter';
import AdminLegalCMS from '../components/legal/AdminLegalCMS';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/legal/terms',
}));

const theme = createTheme();

describe('Legal & Compliance Subsystem Tests', () => {
  it('renders Cookie Consent banner', () => {
    render(
      <ThemeProvider theme={theme}>
        <ConsentBanner />
      </ThemeProvider>
    );
    expect(screen.getByText(/Cookie & Privacy Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Accept All/i)).toBeInTheDocument();
  });

  it('renders Legal Document Viewer with version tracking', () => {
    render(
      <ThemeProvider theme={theme}>
        <LegalDocumentViewer title="Terms of Service" slug="terms" version="1.0.0" />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Terms of Service/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Version 1.0.0/i)).toBeInTheDocument();
  });

  it('renders Privacy Rights Center with export and deletion controls', () => {
    render(
      <ThemeProvider theme={theme}>
        <PrivacyRightsCenter />
      </ThemeProvider>
    );
    expect(screen.getByText(/Privacy & Data Rights Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Data Export/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Account Deletion/i)).toBeInTheDocument();
  });

  it('renders Admin Legal CMS document table', () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminLegalCMS />
      </ThemeProvider>
    );
    expect(screen.getByText(/Legal Document & Compliance CMS/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Terms of Service/i)[0]).toBeInTheDocument();
  });
});
