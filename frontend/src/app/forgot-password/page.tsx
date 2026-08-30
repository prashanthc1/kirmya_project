'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      // Show success state even if email doesn't exist for security
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: '24px',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {submitted ? (
            <Stack spacing={3} alignItems="center" textAlign="center">
              <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Check your email
              </Typography>
              <Typography variant="body1" color="text.secondary">
                We've sent a password reset link to <strong>{email}</strong> if an account exists with that address.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/auth/signin')}
                sx={{ mt: 2, borderRadius: '12px', py: 1.2 }}
              >
                Back to sign in
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                    Reset your password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter your email address and we'll send you a recovery link to reset your password.
                  </Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  fullWidth
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: <MailOutlineIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !email}
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send reset link'}
                </Button>

                <Box textAlign="center">
                  <MuiLink
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => router.push('/auth/signin')}
                    sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
                  >
                    ← Back to sign in
                  </MuiLink>
                </Box>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
