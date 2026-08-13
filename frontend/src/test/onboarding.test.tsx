import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProfileCompletionCard from '../components/onboarding/ProfileCompletionCard';
import SkipResumeDialog from '../components/onboarding/SkipResumeDialog';
import AdminOnboardingDashboard from '../components/admin/onboarding/AdminOnboardingDashboard';

describe('Onboarding & First-Time User Experience Test Suite', () => {
  it('renders ProfileCompletionCard widget with score and suggestions', () => {
    render(<ProfileCompletionCard />);
    expect(screen.getByText(/Profile Completion Strength/i)).toBeInTheDocument();
    expect(screen.getByText(/85% Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Profile Improvements/i)).toBeInTheDocument();
  });

  it('renders SkipResumeDialog modal controls', () => {
    render(<SkipResumeDialog open={true} onClose={() => {}} onSkip={() => {}} onFinishLater={() => {}} />);
    expect(screen.getByText(/Skip Step or Finish Later\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Skip Optional Step/i)).toBeInTheDocument();
    expect(screen.getByText(/Save & Finish Later/i)).toBeInTheDocument();
  });

  it('renders AdminOnboardingDashboard funnel metrics', () => {
    render(<AdminOnboardingDashboard />);
    expect(screen.getByText(/Executive Onboarding Control & Funnel Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Started/i)).toBeInTheDocument();
    expect(screen.getByText(/87.3%/i)).toBeInTheDocument();
  });
});
