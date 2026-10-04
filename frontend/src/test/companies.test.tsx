import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); },
}));

vi.mock('../services/authService', () => ({
  API_BASE_URL: 'http://127.0.0.1:8080/api/v1',
  extractApiError: (err: any, fallback = 'error') => ({ message: err?.response?.data?.error || err?.message || fallback }),
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
    // The context exposes an explicit state machine; guards branch on it
    // rather than inferring 'signed out' from a false boolean.
    status: 'authenticated' as const,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

  describe('/companies/[handle]', () => {
    it('redirects to the public profile at /company/[handle]', async () => {
      await expect(
        CompanyDetailPage({ params: Promise.resolve({ handle: 'acme-corp' }) }),
      ).rejects.toThrow('NEXT_REDIRECT:/company/acme-corp');
    });
  });
});
