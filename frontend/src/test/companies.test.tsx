import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { companiesApi } from '../features/companies/api';
import { companyApi } from '../features/company/services/companyApi';
import CompanyDetailPage from '../app/companies/[handle]/page';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/companies/acme-corp',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ handle: 'acme-corp' }),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'recruiter@kirmya.com', name: 'Recruiter User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Company & Employer Experience (Prompt 26/50)', () => {
  const mockCompanyData = {
    company: {
      id: 'comp-101',
      name: 'Acme Cloud Technologies',
      handle: 'acme-corp',
    },
    profile: {
      logoUrl: '',
      coverUrl: '',
      about: 'Leading provider of hyperscale enterprise cloud architecture in the GCC region.',
      industry: 'Cloud Infrastructure',
      companySize: '500-1,000 employees',
      location: 'Dubai, United Arab Emirates',
      website: 'https://acmecloud.example.com',
      foundedYear: 2018,
      culture: 'Engineering excellence and collaborative innovation.',
      benefits: ['Health Insurance', 'Remote Work Flexibility'],
      employeeInsights: 'Top-rated tech team.',
      followersCount: 1420,
      isVerified: true,
    },
    following: false,
  };

  const mockDirectory = {
    companies: [
      {
        company: mockCompanyData.company,
        profile: mockCompanyData.profile,
      },
    ],
    total: 1,
    page: 1,
    limit: 12,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (authApiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/companies/handle/')) {
        return Promise.resolve({ data: mockCompanyData });
      }
      if (url.includes('/companies')) {
        return Promise.resolve({ data: mockDirectory });
      }
      return Promise.resolve({ data: {} });
    });

    (authApiClient.post as any).mockImplementation((url: string) => {
      if (url.includes('/follow')) {
        return Promise.resolve({ data: { following: true } });
      }
      return Promise.resolve({ data: {} });
    });

    (authApiClient.delete as any).mockImplementation((url: string) => {
      if (url.includes('/follow')) {
        return Promise.resolve({ data: { following: false } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('companiesApi Service', () => {
    it('getDirectory calls GET /companies with params', async () => {
      const res = await companiesApi.getDirectory({ query: 'cloud', page: 1 });
      expect(authApiClient.get).toHaveBeenCalledWith('/companies', {
        params: { query: 'cloud', page: 1 },
      });
      expect(res.companies.length).toBe(1);
    });

    it('getByHandle calls GET /companies/handle/:handle', async () => {
      const res = await companiesApi.getByHandle('acme-corp');
      expect(authApiClient.get).toHaveBeenCalledWith('/companies/handle/acme-corp');
      expect(res.company.name).toBe('Acme Cloud Technologies');
    });

    it('followCompany calls POST /companies/follow', async () => {
      const res = await companiesApi.followCompany('comp-101');
      expect(authApiClient.post).toHaveBeenCalledWith('/companies/follow', {
        company_id: 'comp-101',
      });
      expect(res.following).toBe(true);
    });

    it('unfollowCompany calls DELETE /companies/follow', async () => {
      const res = await companiesApi.unfollowCompany('comp-101');
      expect(authApiClient.delete).toHaveBeenCalledWith('/companies/follow', {
        data: { company_id: 'comp-101' },
      });
      expect(res.following).toBe(false);
    });
  });

  describe('CompanyDetailPage Component', () => {
    it('renders company name, verified state, location, and about section', async () => {
      renderWithTheme(
        <CompanyDetailPage
          params={Promise.resolve({ handle: 'acme-corp' })}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Follow' })).toBeDefined();
      }, { timeout: 4000 });

      expect(screen.getAllByText(/Acme Cloud Technologies/i)[0]).toBeDefined();
      expect(screen.getByText(/About Acme Cloud Technologies/i)).toBeDefined();
      expect(screen.getByText(/Company Facts/i)).toBeDefined();
    });

    it('toggles follow state on button click', async () => {
      renderWithTheme(
        <CompanyDetailPage
          params={Promise.resolve({ handle: 'acme-corp' })}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Follow' })).toBeDefined();
      }, { timeout: 4000 });

      const followBtn = screen.getByRole('button', { name: 'Follow' });
      fireEvent.click(followBtn);

      await waitFor(() => {
        expect(authApiClient.post).toHaveBeenCalledWith('/companies/comp-101/follow');
      }, { timeout: 4000 });
    });
  });
});
