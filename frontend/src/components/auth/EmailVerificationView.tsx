'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';

import AuthHeader from './AuthHeader';
import AuthFooter from './AuthFooter';
import { authService } from '../../services/authService';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

export const EmailVerificationView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifyToken = async () => {
      setVerifying(true);
      setError(null);
      try {
        await authService.verifyEmail(token);
        if (isMounted) {
          setVerified(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.error ||
              'Verification link is invalid or has expired. Please request a new link.'
          );
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || cooldown > 0) return;

    setResending(true);
    setResendSuccess(false);
    setError(null);
    try {
      await authService.resendVerification(email.trim().toLowerCase());
      setResendSuccess(true);
      setCooldown(60);
    } catch {
      // For security, show success even if email isn't in system
      setResendSuccess(true);
      setCooldown(60);
    } finally {
      setResending(false);
    }
  };

  return (
    <Box>
      <AuthHeader
        title="Email Verification"
        subtitle="Confirm your email address to activate your Kirmya profile."
      />

      {verifying && (
        <Stack spacing={2} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={40} color="primary" />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Verifying your email address...
          </Typography>
        </Stack>
      )}

      {!verifying && verified && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Email Verified Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your email has been confirmed. You can now complete your onboarding profile.
          </Typography>

          <Button
            component={Link}
            href={ROUTES.ONBOARDING}
            variant="contained"
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
          >
            Continue to Onboarding
          </Button>
        </Box>
      )}

      {!verifying && !verified && (
        <Box>
          {error && (
            <Alert
              severity="error"
              icon={<ErrorOutlineIcon fontSize="inherit" />}
              sx={{ mb: 2.5, borderRadius: `${tokens.radius.sm}px` }}
            >
              {error}
            </Alert>
          )}

          {resendSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 2.5, borderRadius: `${tokens.radius.sm}px` }}
            >
              If an account matches that address, a new verification link has been sent.
            </Alert>
          )}

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 48, mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Check your inbox
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click the link in the verification email to verify your account. If you haven&apos;t received it, request a new link below.
            </Typography>
          </Box>

          <form onSubmit={handleResend}>
            <Stack spacing={2}>
              <TextField
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                fullWidth
                variant="outlined"
                disabled={resending || cooldown > 0}
                required
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={resending || cooldown > 0 || !email.trim()}
                sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
              >
                {resending
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : 'Resend Verification Email'}
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
        </Box>
      )}

      <AuthFooter />
    </Box>
  );
};

export default EmailVerificationView;
