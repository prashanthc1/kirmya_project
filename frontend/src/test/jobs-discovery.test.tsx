import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { JobCard } from '../components/jobs/JobCard';
import { JobSearchFilters } from '../components/jobs/JobSearchFilters';
import { JobDetailView } from '../components/jobs/JobDetailView';
import { SavedJobButton } from '../components/jobs/SavedJobButton';
import { JobDetail, JobSummary } from '../features/jobs/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/jobs',
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@kirmya.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      roleId: 'candidate',
    },
    authenticated: true,
    loading: false,
    notificationsCount: 0,
    unreadMessagesCount: 0,
    logout: vi.fn(),
  }),
  default: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@kirmya.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      roleId: 'candidate',
    },
    authenticated: true,
    loading: false,
    notificationsCount: 0,
    unreadMessagesCount: 0,
    logout: vi.fn(),
  }),
}));

const theme = getTheme('light');

const mockJob: JobSummary = {
  id: 'job-123',
  title: 'Staff Distributed Systems Engineer',
  company_name: 'Stripe',
  company_handle: 'stripe',
  location: 'San Francisco, CA',
  work_mode: 'hybrid',
  employment_type: 'Full-time',
  salary_range: '$180,000 - $220,000 / yr',
  skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Distributed Systems'],
  is_featured: true,
  created_at: new Date().toISOString(),
};

const mockJobDetail: JobDetail = {
  ...mockJob,
  description: 'We are seeking an experienced Staff Engineer to lead distributed ledger architecture.',
  requirements: ['8+ years in Go or Rust', 'Experience building high-throughput services'],
  responsibilities: ['Architect fault-tolerant systems', 'Mentor senior engineers'],
  benefits: ['Comprehensive health insurance', 'Remote work stipend', '401k matching'],
  status: 'active',
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Jobs Experience & Discovery (Prompt 16/50)', () => {
  it('renders JobCard with title, company, location, salary, and skills', () => {
    renderWithTheme(<JobCard job={mockJob} />);
    expect(screen.getByText('Staff Distributed Systems Engineer')).toBeDefined();
    expect(screen.getByText('Stripe')).toBeDefined();
    expect(screen.getByText('San Francisco, CA')).toBeDefined();
    expect(screen.getByText('$180,000 - $220,000 / yr')).toBeDefined();
    expect(screen.getByText('Featured')).toBeDefined();
    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('Kubernetes')).toBeDefined();
  });

  it('renders JobSearchFilters and triggers onSearch callback', () => {
    const handleSearch = vi.fn();
    const handleClear = vi.fn();
    renderWithTheme(
      <JobSearchFilters
        initialValues={{ q: 'Engineer', location: 'Remote' }}
        onSearch={handleSearch}
        onClear={handleClear}
      />
    );

    expect(screen.getByDisplayValue('Engineer')).toBeDefined();
    expect(screen.getByDisplayValue('Remote')).toBeDefined();

    const findJobsBtn = screen.getByRole('button', { name: /Find Jobs/i });
    fireEvent.click(findJobsBtn);
    expect(handleSearch).toHaveBeenCalled();
  });

  it('renders JobDetailView with description, responsibilities, requirements, and Apply CTA', () => {
    renderWithTheme(<JobDetailView job={mockJobDetail} />);
    expect(screen.getByText('Staff Distributed Systems Engineer')).toBeDefined();
    expect(screen.getByText(/We are seeking an experienced Staff Engineer/i)).toBeDefined();
    expect(screen.getByText(/8\+ years in Go or Rust/i)).toBeDefined();
    expect(screen.getByText(/Comprehensive health insurance/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Apply for this Role/i })).toBeDefined();
  });

  it('renders SavedJobButton with accessible tooltip and aria-label', () => {
    renderWithTheme(<SavedJobButton jobId="job-123" jobTitle="Staff Engineer" />);
    const btn = screen.getByRole('button', { name: /Save Staff Engineer/i });
    expect(btn).toBeDefined();
  });
});
