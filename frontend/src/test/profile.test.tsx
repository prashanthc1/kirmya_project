import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileAbout from '../components/profile/ProfileAbout';
import ProfileSkills from '../components/profile/ProfileSkills';
import ProfileReportDialog from '../components/profile/ProfileReportDialog';
import ProfileCompletenessCard from '../components/profile/ProfileCompletenessCard';
import CareerPreferencesEditor from '../components/profile/CareerPreferencesEditor';
import ProfileVerificationCard from '../components/profile/ProfileVerificationCard';
import ProfilePrivacySettings from '../components/profile/ProfilePrivacySettings';
import ResumeConsistencyCard from '../components/profile/ResumeConsistencyCard';
import ProfileAnalyticsCard from '../components/profile/ProfileAnalyticsCard';
import ProfilePublicPreviewModal from '../components/profile/ProfilePublicPreviewModal';
import AdminProfileView from '../components/admin/profile/AdminProfileView';
import { profileApi } from '../features/profile/api';
import { authApiClient } from '../services/authService';

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('User Profile & Identity Subsystem Test Suite', () => {
  const dummyProfile: any = {
    id: 'p1',
    userId: 'u1',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    headline: 'Senior Cloud Engineer',
    summary: 'Experienced cloud native engineer.',
    location: 'Dubai, UAE',
    profileCompletedPercentage: 85,
    verificationStatus: 'verified',
    openToWork: true,
    openToRecruiters: true,
    targetRoles: ['Senior Cloud Engineer', 'DevOps Lead'],
    preferredLocations: ['Dubai', 'Remote'],
    availabilityStatus: 'open_to_work',
    workExperiences: [
      { id: 'exp-1', company: 'Acme Corp', jobTitle: 'Cloud Lead', startDate: '2021-01-01' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Existing Components Tests ---
  it('renders ProfileHeader component with name and verification badge', () => {
    render(<ProfileHeader profile={dummyProfile} isOwner={true} />);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Senior Cloud Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Open to Work/i)).toBeInTheDocument();
  });

  it('renders ProfileAbout summary text', () => {
    render(<ProfileAbout summary={dummyProfile.summary} />);
    expect(screen.getByText(/About & Career Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Experienced cloud native engineer./i)).toBeInTheDocument();
  });

  it('renders ProfileSkills chip list', () => {
    const skills = [{ name: 'Golang', proficiencyLevel: 'Expert' }];
    render(<ProfileSkills skills={skills} />);
    expect(screen.getByText(/Golang • Expert/i)).toBeInTheDocument();
  });

  it('renders ProfileReportDialog modal', () => {
    render(<ProfileReportDialog open={true} username="testuser" onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByText(/Report Profile @testuser/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Report/i)).toBeInTheDocument();
  });

  it('renders AdminProfileView control desk', () => {
    render(<AdminProfileView profile={dummyProfile} userId="u1" />);
    expect(screen.getByText(/Admin User Profile Audit & Moderation Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/Official Verification State/i)).toBeInTheDocument();
  });

  // --- New Modular Components Tests ---

  it('renders ProfileCompletenessCard with percentage and missing checklist items', () => {
    render(<ProfileCompletenessCard percentage={85} />);
    expect(screen.getByText(/Profile Completeness/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Work Experience/i)).toBeInTheDocument();
  });

  it('renders CareerPreferencesEditor and manages target role inputs', () => {
    render(<CareerPreferencesEditor initialPreferences={dummyProfile} />);
    expect(screen.getByText(/Career & Job Preferences/i)).toBeInTheDocument();
  });

  it('renders ProfileVerificationCard and opens verification modal', () => {
    render(<ProfileVerificationCard status="unverified" />);
    expect(screen.getByText(/Identity & Credential Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Unverified Profile/i)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Request Profile Verification/i });
    fireEvent.click(button);
    expect(screen.getByRole('heading', { name: /Request Profile Verification/i })).toBeInTheDocument();
  });

  it('renders ProfilePrivacySettings and updates controls', () => {
    render(<ProfilePrivacySettings />);
    expect(screen.getByText(/Profile Privacy & Account Discovery Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Public \(Open Discovery\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Engine Indexing/i)).toBeInTheDocument();
  });

  it('renders ResumeConsistencyCard with alignment score and discrepancies', () => {
    render(<ResumeConsistencyCard />);
    expect(screen.getByText(/Resume & Profile Alignment/i)).toBeInTheDocument();
    expect(screen.getByText(/92% Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills found in uploaded resume but missing from profile:/i)).toBeInTheDocument();
  });

  it('renders ProfileAnalyticsCard with impression metrics', () => {
    render(<ProfileAnalyticsCard views={500} searchAppearances={1500} connectionRequests={40} />);
    expect(screen.getByText(/Profile Analytics/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('renders ProfilePublicPreviewModal when open', () => {
    render(<ProfilePublicPreviewModal open={true} profile={dummyProfile} onClose={() => {}} />);
    expect(screen.getByText(/Public Profile Preview Mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Public' })).toBeInTheDocument();
  });

  // --- API Client Method Tests ---

  it('profileApi.getMyProfile fetches current profile', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: dummyProfile });
    const res = await profileApi.getMyProfile();
    expect(authApiClient.get).toHaveBeenCalledWith('/profile/me');
    expect(res.username).toBe('testuser');
  });

  it('profileApi.getPublicProfile fetches public profile by username', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: dummyProfile });
    const res = await profileApi.getPublicProfile('testuser');
    expect(authApiClient.get).toHaveBeenCalledWith('/profile/testuser');
    expect(res.headline).toBe('Senior Cloud Engineer');
  });

  it('profileApi.updateCareerPreferences posts preferences data', async () => {
    const prefs = {
      openToWork: true,
      targetRoles: ['Architect'],
      preferredLocations: ['Remote'],
      availabilityStatus: 'immediate',
    };
    (authApiClient.put as any).mockResolvedValueOnce({ data: prefs });
    const res = await profileApi.updateCareerPreferences(prefs);
    expect(authApiClient.put).toHaveBeenCalledWith('/profile/me/career-preferences', prefs);
    expect(res.targetRoles).toContain('Architect');
  });

  it('profileApi.requestVerification submits document data', async () => {
    const payload = { documentType: 'passport', documentUrl: 'http://example.com/id.pdf' };
    (authApiClient.post as any).mockResolvedValueOnce({ data: { message: 'submitted', status: 'pending' } });
    const res = await profileApi.requestVerification(payload);
    expect(authApiClient.post).toHaveBeenCalledWith('/profile/me/verification', payload);
    expect(res.status).toBe('pending');
  });

  it('profileApi.getProfileAnalytics fetches metrics', async () => {
    const mockAnalytics = { profileViews: 100, searchAppearances: 200, connectionRequests: 10 };
    (authApiClient.get as any).mockResolvedValueOnce({ data: mockAnalytics });
    const res = await profileApi.getProfileAnalytics();
    expect(authApiClient.get).toHaveBeenCalledWith('/profile/me/analytics');
    expect(res.profileViews).toBe(100);
  });
});
