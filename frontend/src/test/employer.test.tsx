import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils';

import EmployerSettings from '../components/company/EmployerSettings';
import TransferOwnershipDialog from '../components/company/TransferOwnershipDialog';
import EmployerDashboardPage from '../app/employer/dashboard/page';
import EmployerCompanyPage from '../app/employer/company/page';
import EmployerJobsPage from '../app/employer/jobs/page';
import EmployerApplicationsPage from '../app/employer/applications/page';
import EmployerCandidatesPage from '../app/employer/candidates/page';
import EmployerInterviewsPage from '../app/employer/interviews/page';
import EmployerTeamPage from '../app/employer/team/page';
import EmployerSettingsPage from '../app/employer/settings/page';
import { CompanyPerson, EmployerSettings as EmployerSettingsType } from '../features/company/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('company=comp-1'),
  usePathname: () => '/employer/dashboard',
}));

vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'user-1', name: 'Test Employer' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('../features/company/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/company/hooks')>();
  return {
    ...actual,
    useMyCompanies: () => ({
      data: [
        {
          company: {
            id: 'comp-1',
            name: 'Acme Corp',
            slug: 'acme-corp',
            tagline: 'Building the Future',
            logoUrl: '',
            coverUrl: '',
            industry: 'Technology',
            companyType: 'Privately Held',
            companySize: '50-200',
            headquarters: 'San Francisco, CA',
            followersCount: 150,
            employeesCount: 45,
            openJobsCount: 8,
            rating: 4.8,
            reviewCount: 12,
            isHiring: true,
            verificationStatus: 'verified',
            isVerified: true,
            isFollowing: false,
          },
          roles: ['company_owner', 'org_admin'],
          permissions: [
            'company:view',
            'company:edit',
            'branding:edit',
            'job:view',
            'job:create',
            'application:view',
            'team:view',
            'settings:edit',
            'analytics:job:view',
          ],
        },
      ],
      isLoading: false,
      isError: false,
    }),
  };
});

const mockSettings: EmployerSettingsType = {
  companyId: 'comp-1',
  defaultRecruiterId: 'rec-1',
  defaultPipeline: 'standard',
  newApplicationNotification: true,
  candidateMessageNotification: true,
  interviewReminderNotification: true,
  autoAcknowledgeApplication: true,
  autoAcknowledgeMessage: 'Thank you for applying to our organization!',
  candidateVisibilityMode: 'team_only',
  dataExportRetentionDays: 90,
  updatedAt: new Date().toISOString(),
};

const mockMembers: CompanyPerson[] = [
  {
    id: 'm-1',
    userId: 'u-1',
    name: 'Sarah Connor',
    photoUrl: '',
    jobTitle: 'VP of People',
    department: 'HR',
    location: 'Remote',
    associationType: 'current_employee',
    status: 'approved',
    role: 'org_admin',
    isPublic: true,
    joinedAt: '2025-01-01',
  },
  {
    id: 'm-2',
    userId: 'u-2',
    name: 'John Doe',
    photoUrl: '',
    jobTitle: 'Lead Recruiter',
    department: 'Talent Acquisition',
    location: 'San Francisco',
    associationType: 'recruiter',
    status: 'approved',
    role: 'recruiter_admin',
    isPublic: true,
    joinedAt: '2025-02-01',
  },
];

describe('Employer Management Components & Pages Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EmployerSettings Component', () => {
    it('renders pipeline, notification, auto-ack, and data export panels', () => {
      renderWithProviders(
        <EmployerSettings companyId="comp-1" initialSettings={mockSettings} />
      );

      expect(screen.getByText(/Pipeline & Default Assignments/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Default Application Pipeline/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Candidate Auto-Acknowledgement/i)).toBeInTheDocument();
      expect(screen.getByText(/Recruitment Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Data & Compliance Export/i)).toBeInTheDocument();
      expect(screen.getByText(/Export Company Data Package/i)).toBeInTheDocument();
    });

    it('renders read-only notice when readOnly prop is true', () => {
      renderWithProviders(
        <EmployerSettings companyId="comp-1" initialSettings={mockSettings} readOnly={true} />
      );

      expect(screen.getByText(/viewing recruitment settings in read-only mode/i)).toBeInTheDocument();
    });
  });

  describe('TransferOwnershipDialog Component', () => {
    it('renders warning alert and selection dropdown when open', () => {
      renderWithProviders(
        <TransferOwnershipDialog
          open={true}
          onClose={vi.fn()}
          companyId="comp-1"
          members={mockMembers}
        />
      );

      expect(screen.getByText(/Transfer Organization Ownership/i)).toBeInTheDocument();
      expect(screen.getByText(/Irreversible Action/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Select New Owner/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Confirm Ownership Transfer/i)).toBeInTheDocument();
    });
  });

  describe('Employer Portal Pages', () => {
    it('renders Employer Dashboard Page structure', () => {
      renderWithProviders(<EmployerDashboardPage />);
      expect(screen.getAllByText(/Employer Recruitment Dashboard/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Company Profile Page structure', () => {
      renderWithProviders(<EmployerCompanyPage />);
      expect(screen.getAllByText(/Company Profile & Employer Branding/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Jobs Management Page structure', () => {
      renderWithProviders(<EmployerJobsPage />);
      expect(screen.getAllByText(/Jobs Management/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Application Tracker Page structure', () => {
      renderWithProviders(<EmployerApplicationsPage />);
      expect(screen.getAllByText(/Application Tracker/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Candidate Pipeline Page structure', () => {
      renderWithProviders(<EmployerCandidatesPage />);
      expect(screen.getAllByText(/Candidate Pipeline/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Interview Coordination Page structure', () => {
      renderWithProviders(<EmployerInterviewsPage />);
      expect(screen.getAllByText(/Interview Coordination/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Team Management Page structure', () => {
      renderWithProviders(<EmployerTeamPage />);
      expect(screen.getAllByText(/Recruiter Team & Organization Roles/i).length).toBeGreaterThan(0);
    });

    it('renders Employer Recruitment Settings Page structure', () => {
      renderWithProviders(<EmployerSettingsPage />);
      expect(screen.getAllByText(/Employer Recruitment Settings/i).length).toBeGreaterThan(0);
    });
  });
});
