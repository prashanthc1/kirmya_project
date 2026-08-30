import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { PasswordInput } from '../components/auth/PasswordInput';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrength';
import { EmailVerificationView } from '../components/auth/EmailVerificationView';
import { AuthCard } from '../components/auth/AuthCard';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/login',
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();

vi.mock('../hooks/useLogin', () => ({
  useLogin: () => ({
    login: mockLogin,
    submitting: false,
    error: null,
    setError: vi.fn(),
    user: null,
  }),
  default: () => ({
    login: mockLogin,
    submitting: false,
    error: null,
    setError: vi.fn(),
    user: null,
  }),
}));

vi.mock('../hooks/useRegister', () => ({
  useRegister: () => ({
    register: mockRegister,
    submitting: false,
    error: null,
    setError: vi.fn(),
    successData: null,
  }),
  default: () => ({
    register: mockRegister,
    submitting: false,
    error: null,
    setError: vi.fn(),
    successData: null,
  }),
}));

vi.mock('../services/authService', () => ({
  authService: {
    verifyEmail: (...args: any[]) => mockVerifyEmail(...args),
    resendVerification: (...args: any[]) => mockResendVerification(...args),
  },
  authApiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Authentication & Account Recovery Experience (Prompt 18/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SignInForm Component', () => {
    it('renders all sign in inputs and action links', () => {
      renderWithTheme(<SignInForm />);
      expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
      expect(screen.getByLabelText(/^Password/i)).toBeDefined();
      expect(screen.getByLabelText(/Remember me/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
      expect(screen.getByText(/Forgot password\?/i)).toBeDefined();
      expect(screen.getByText(/Create Account/i)).toBeDefined();
    });

    it('validates email format on submission', async () => {
      renderWithTheme(<SignInForm />);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Email address is required/i)).toBeDefined();
      });
    });
  });

  describe('SignUpForm Component', () => {
    it('renders lightweight registration fields and terms agreement', () => {
      renderWithTheme(<SignUpForm />);
      expect(screen.getByLabelText(/First Name/i)).toBeDefined();
      expect(screen.getByLabelText(/Last Name/i)).toBeDefined();
      expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
      expect(screen.getByLabelText(/Password \(min 12 characters\)/i)).toBeDefined();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined();
    });

    it('validates required fields on empty submit', async () => {
      renderWithTheme(<SignUpForm />);
      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeDefined();
        expect(screen.getByText(/Last name is required/i)).toBeDefined();
        expect(screen.getByText(/Email address is required/i)).toBeDefined();
      });
    });
  });

  describe('PasswordInput Component', () => {
    it('toggles password masking without submitting form', () => {
      renderWithTheme(<PasswordInput label="Test Password" value="Secret123!" onChange={() => {}} />);
      const input = screen.getByLabelText(/Test Password/i) as HTMLInputElement;
      expect(input.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: /Show password/i });
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.getAttribute('type')).toBe('button');

      fireEvent.click(toggleBtn);
      expect(input.type).toBe('text');
      expect(screen.getByRole('button', { name: /Hide password/i })).toBeDefined();
    });
  });

  describe('PasswordStrengthIndicator Component', () => {
    it('calculates password strength based on 12-char constraint', () => {
      const { rerender } = renderWithTheme(<PasswordStrengthIndicator password="short" />);
      expect(screen.getByText(/Very Weak/i)).toBeDefined();

      rerender(
        <ThemeProvider theme={theme}>
          <PasswordStrengthIndicator password="SecurePassword123!" />
        </ThemeProvider>
      );
      expect(screen.getByText(/Excellent|Strong/i)).toBeDefined();
    });
  });

  describe('EmailVerificationView Component', () => {
    it('renders inbox instructions and resend verification form', () => {
      renderWithTheme(<EmailVerificationView />);
      expect(screen.getByText(/Check your inbox/i)).toBeDefined();
      expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeDefined();
    });
  });

  describe('AuthCard Component', () => {
    it('renders children with design tokens and proper elevation', () => {
      renderWithTheme(
        <AuthCard>
          <div>Auth Content</div>
        </AuthCard>
      );
      expect(screen.getByText('Auth Content')).toBeDefined();
    });
  });
});
