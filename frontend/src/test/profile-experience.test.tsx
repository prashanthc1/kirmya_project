import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileAbout } from '../components/profile/ProfileAbout';
import { ProfileExperience } from '../components/profile/ProfileExperience';
import { ProfileEducation } from '../components/profile/ProfileEducation';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { ProfileCompletenessCard } from '../components/profile/ProfileCompletenessCard';
import { ProfileAnalyticsCard } from '../components/profile/ProfileAnalyticsCard';
import { UserProfile } from '../features/profile/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/profile',
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'alex@kirmya.com',
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
      email: 'alex@kirmya.com',
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

const mockProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  username: 'alexmorgan',
  firstName: 'Alex',
  lastName: 'Morgan',
  avatarUrl: '',
  coverUrl: '',
  headline: 'Principal Cloud Infrastructure Engineer',
  summary: 'Specializing in resilient distributed architectures, Go microservices, and Kubernetes orchestration.',
  location: 'San Francisco, CA',
  country: 'USA',
  industry: 'Cloud Infrastructure',
  currentPosition: 'Principal Engineer at CloudScale',
  availabilityStatus: 'open_to_work',
  openToWork: true,
  openToRecruiters: true,
  targetRoles: ['Principal Engineer', 'Staff Architect'],
  preferredLocations: ['San Francisco', 'Remote'],
  profileCompletedPercentage: 90,
  verificationStatus: 'verified',
  workExperiences: [
    {
      id: 'exp-1',
      company: 'CloudScale Inc.',
      jobTitle: 'Principal Engineer',
      employmentType: 'Full-time',
      location: 'San Francisco, CA',
      startDate: '2022-03-01',
      isCurrentJob: true,
      description: 'Architected distributed multi-region data pipelines handling 1M RPS.',
    },
  ],
  educations: [
    {
      id: 'edu-1',
      institution: 'UC Berkeley',
      degree: 'B.S. Electrical Engineering & Computer Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2014-09-01',
      endDate: '2018-05-15',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'Go', proficiencyLevel: 'Expert' },
    { id: 'sk-2', name: 'Kubernetes', proficiencyLevel: 'Expert' },
    { id: 'sk-3', name: 'PostgreSQL', proficiencyLevel: 'Advanced' },
  ],
  profileViewsCount: 340,
  searchAppearancesCount: 890,
  connectionRequestsCount: 24,
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Professional Profile Experience (Prompt 17/50)', () => {
  it('renders ProfileHeader with name, headline, location, and verified badge', () => {
    renderWithTheme(<ProfileHeader profile={mockProfile} isOwner={true} />);
    expect(screen.getByText('Alex Morgan')).toBeDefined();
    expect(screen.getByText('Principal Cloud Infrastructure Engineer')).toBeDefined();
    expect(screen.getByText(/San Francisco, CA/i)).toBeDefined();
    expect(screen.getByText('Verified')).toBeDefined();
    expect(screen.getByText('Open to Work')).toBeDefined();
    expect(screen.getByText('Edit Profile')).toBeDefined();
  });

  it('renders ProfileAbout with career summary', () => {
    renderWithTheme(<ProfileAbout summary={mockProfile.summary} isOwner={true} />);
    expect(screen.getByText(/Specializing in resilient distributed architectures/i)).toBeDefined();
  });

  it('renders ProfileExperience with position details and Current badge', () => {
    renderWithTheme(<ProfileExperience experiences={mockProfile.workExperiences} isOwner={true} />);
    expect(screen.getByText('Principal Engineer')).toBeDefined();
    expect(screen.getByText(/CloudScale Inc\./i)).toBeDefined();
    expect(screen.getByText('Current')).toBeDefined();
  });

  it('renders ProfileEducation with degree and institution', () => {
    renderWithTheme(<ProfileEducation educations={mockProfile.educations} isOwner={true} />);
    expect(screen.getByText(/B\.S\. Electrical Engineering/i)).toBeDefined();
    expect(screen.getByText('UC Berkeley')).toBeDefined();
  });

  it('renders ProfileSkills with skill badges', () => {
    renderWithTheme(<ProfileSkills skills={mockProfile.skills} isOwner={true} />);
    expect(screen.getByText(/Go • Expert/i)).toBeDefined();
    expect(screen.getByText(/Kubernetes • Expert/i)).toBeDefined();
  });

  it('renders ProfileCompletenessCard with percentage', () => {
    renderWithTheme(<ProfileCompletenessCard percentage={90} />);
    expect(screen.getByText('90%')).toBeDefined();
    expect(screen.getByText(/Profile Completeness/i)).toBeDefined();
  });

  it('renders ProfileAnalyticsCard with impression counts', () => {
    renderWithTheme(
      <ProfileAnalyticsCard
        views={mockProfile.profileViewsCount}
        searchAppearances={mockProfile.searchAppearancesCount}
        connectionRequests={mockProfile.connectionRequestsCount}
      />
    );
    expect(screen.getByText('340')).toBeDefined();
    expect(screen.getByText('890')).toBeDefined();
    expect(screen.getByText('24')).toBeDefined();
  });
});
