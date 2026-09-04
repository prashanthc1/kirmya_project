'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import Link from 'next/link';

import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthErrorBoundary from '../../components/auth/ErrorBoundary';
import { authApiClient, extractApiError } from '../../services/authService';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return;

    if (!EMAIL_PATTERN.test(address)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApiClient.post('/auth/forgot-password', { email: address });
      setSubmitted(true);
    } catch (err) {
      const parsed = extractApiError(
        err,
        'We could not send the reset email. Please check your connection and try again.'
      );

      // The backend answers 200 whether or not the address has an account, so
      // there is no "user not found" response to hide here. Every error that
      // does arrive is a real failure — rate limiting, a validation refusal, a
      // server or network fault — and showing "check your email" for those
      // leaves someone waiting for a message that is never coming. This
      // previously reported success for all of them.
      if (parsed.status === 429) {
        setError('Too many reset requests. Please wait a few minutes before trying again.');
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot Password"
        subtitle="Enter your email to receive password recovery instructions."
      />

      {submitted ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Check your email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            If an account exists for <strong>{email}</strong>, we&apos;ve sent instructions on how to reset your password.
          </Typography>

          <Button
            component={Link}
            href="/login"
            variant="contained"
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
          >
            Return to Sign In
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => setSubmitted(false)}
            sx={{ mt: 1, fontWeight: 600 }}
          >
            Use a different email address
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
              >
                {error}
              </Alert>
            )}

            <TextField
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              fullWidth
              variant="outlined"
              autoComplete="email"
              autoFocus
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !email.trim()}
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
                  <span>Sending reset link...</span>
                </Stack>
              ) : (
                'Send Reset Link'
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

export default function ForgotPasswordPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </AuthErrorBoundary>
  );
}
