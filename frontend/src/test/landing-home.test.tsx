import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import HeroSection from '../components/landing/HeroSection';
import WhyKirmyaSection from '../components/landing/WhyKirmyaSection';
import Footer from '../components/landing/Footer';
import FeedPage from '../app/feed/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@kirmya.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      roleId: 'candidate',
      jobTitle: 'Senior Software Engineer',
    },
    authenticated: true,
    loading: false,
    notificationsCount: 2,
    unreadMessagesCount: 1,
    logout: vi.fn(),
  }),
  default: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@kirmya.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      roleId: 'candidate',
      jobTitle: 'Senior Software Engineer',
    },
    authenticated: true,
    loading: false,
    notificationsCount: 2,
    unreadMessagesCount: 1,
    logout: vi.fn(),
  }),
}));

const theme = getTheme('light');

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Landing Page & Home Experience (Prompt 15/50)', () => {
  it('renders HeroSection with headline, value proposition and CTAs', () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByText(/Restart your career with confidence/i)).toBeDefined();
    expect(screen.getByText(/Get Started Free/i)).toBeDefined();
    expect(screen.getByText(/Explore Jobs/i)).toBeDefined();
  });

  it('renders WhyKirmyaSection with value cards', () => {
    renderWithProviders(<WhyKirmyaSection />);
    expect(screen.getByText(/Built for professional momentum/i)).toBeDefined();
    expect(screen.getByText(/Helping Professionals Recover After Layoffs/i)).toBeDefined();
    expect(screen.getByText(/100% Free For Candidates/i)).toBeDefined();
  });

  it('renders Footer with valid route links', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/Kirmya is a professional networking/i)).toBeDefined();
    expect(screen.getByText(/Find Jobs/i)).toBeDefined();
    expect(screen.getByText(/Privacy Policy/i)).toBeDefined();
    expect(screen.getByText(/Terms of Service/i)).toBeDefined();
  });

  it('renders FeedPage with personalized feed shell and recommended jobs', () => {
    renderWithProviders(<FeedPage />);
    expect(screen.getByText(/Recommended Jobs For You/i)).toBeDefined();
    expect(screen.getByText(/AI Career Assistant/i)).toBeDefined();
    expect(screen.getByText(/Peer Communities/i)).toBeDefined();
    expect(screen.getByText(/Welcome back, Alex/i)).toBeDefined();
  });
});
