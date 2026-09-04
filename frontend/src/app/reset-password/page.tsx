'use client';

import React, { useState, Suspense } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthFooter from '../../components/auth/AuthFooter';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrength';
import AuthErrorBoundary from '../../components/auth/ErrorBoundary';
import { authApiClient, extractApiError } from '../../services/authService';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkRejected, setLinkRejected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApiClient.post('/auth/reset-password', {
        token,
        password,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      const parsed = extractApiError(
        err,
        'Failed to reset password. The link may have expired or is invalid.'
      );
      setError(
        parsed.status === 429
          ? 'Too many attempts. Please wait a few minutes before trying again.'
          : parsed.message
      );
      // A refused token cannot be retried with a different password, so the
      // recovery is a new link rather than another submission.
      setLinkRejected(parsed.status === 400 || parsed.status === 401);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    // Reached by opening /reset-password directly, or by following a link that
    // a mail client truncated. Rendering the form here would take a password,
    // post an empty token and fail with a generic server error; naming the
    // problem and offering the way back is the honest response.
    return (
      <AuthCard>
        <AuthHeader
          title="Reset link is incomplete"
          subtitle="This page needs the link from your password reset email."
        />
        <Alert severity="warning" sx={{ borderRadius: `${tokens.radius.sm}px`, mb: 2.5 }}>
          The reset link is missing its token. Open the most recent link from your email, or
          request a new one below.
        </Alert>
        <Stack spacing={1.5}>
          <Button
            component={Link}
            href="/forgot-password"
            variant="contained"
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
          >
            Request a new reset link
          </Button>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            fullWidth
            sx={{ py: 1.2, fontWeight: 600, borderRadius: `${tokens.radius.md}px` }}
          >
            Back to Sign In
          </Button>
        </Stack>
        <AuthFooter />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset Password"
        subtitle="Create a new secure password for your Kirmya account."
      />

      {success ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Password Reset Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your password has been updated. You can now sign in with your new credentials.
          </Typography>

          <Button
            component={Link}
            href="/login"
            variant="contained"
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
          >
            Sign In
          </Button>
        </Box>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {error && (
              <Alert
                severity="error"
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
                onClose={() => setError(null)}
                action={
                  linkRejected ? (
                    <Button component={Link} href="/forgot-password" size="small" color="inherit">
                      Get a new link
                    </Button>
                  ) : undefined
                }
              >
                {error}
              </Alert>
            )}

            <Box>
              <PasswordInput
                label="New Password (min 12 characters)"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <PasswordStrengthIndicator password={password} />
            </Box>

            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !password || !confirmPassword}
              sx={{
                py: 1.4,
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: `${tokens.radius.md}px`,
              }}
            >
              {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} color="inherit" />
                  <span>Resetting password...</span>
                </Stack>
              ) : (
                'Set New Password'
              )}
            </Button>

            <Button
              component={Link}
              href="/login"
              variant="outlined"
              fullWidth
              sx={{ py: 1.2, fontWeight: 600, borderRadius: `${tokens.radius.md}px` }}
            >
              Back to Sign In
            </Button>
          </Stack>
        </form>
      )}

      <AuthFooter />
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <Suspense
          fallback={
            <AuthCard>
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={120} />
                <Skeleton variant="rounded" height={48} />
              </Stack>
            </AuthCard>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthLayout>
    </AuthErrorBoundary>
  );
}
