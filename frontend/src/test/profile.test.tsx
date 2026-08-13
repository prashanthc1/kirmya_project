import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileAbout from '../components/profile/ProfileAbout';
import ProfileSkills from '../components/profile/ProfileSkills';
import ProfileReportDialog from '../components/profile/ProfileReportDialog';
import AdminProfileView from '../components/admin/profile/AdminProfileView';

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
  };

  it('renders ProfileHeader component with name and verification badge', () => {
    render(<ProfileHeader profile={dummyProfile} isOwner={true} />);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Senior Cloud Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/#OpenToWork/i)).toBeInTheDocument();
  });

  it('renders ProfileAbout summary text', () => {
    render(<ProfileAbout summary={dummyProfile.summary} />);
    expect(screen.getByText(/About & Professional Summary/i)).toBeInTheDocument();
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
});
