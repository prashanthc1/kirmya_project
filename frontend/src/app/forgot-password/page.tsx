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
import { authApiClient } from '../../services/authService';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await authApiClient.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch {
      // Privacy protection: show success state even if email doesn't exist
      setSubmitted(true);
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
        </Box>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
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
