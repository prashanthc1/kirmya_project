'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  Typography,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import AuthHeader from './AuthHeader';
import PasswordInput from './PasswordInput';
import SocialLoginButtons from './SocialLoginButtons';
import AuthFooter from './AuthFooter';
import { useLogin } from '../../hooks/useLogin';

// Zod Validation Schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().default(false),
});

type SignInFormInputs = z.infer<typeof signInSchema>;

export const SignInForm: React.FC = () => {
  const router = useRouter();
  const { login, submitting, error, setError } = useLogin();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormInputs>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormInputs) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Lowercase normalization
      const normalizedEmail = data.email.trim().toLowerCase();

      const res = await login({
        email: normalizedEmail,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      setSuccessMessage('Authentication successful. Redirecting...');

      // Role-based navigation
      const userRole = (res?.user?.roleId || 'candidate').toLowerCase();
      setTimeout(() => {
        if (userRole.includes('admin') || userRole === 'platform_admin') {
          router.push('/admin');
        } else if (userRole.includes('company')) {
          router.push('/company');
        } else if (userRole.includes('recruiter')) {
          router.push('/recruiter');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } catch {
      // Error is caught and set inside useLogin hook
    }
  };

  return (
    <Box>
      <AuthHeader title="Sign In to Kirmya" subtitle="Enter your credentials to access your professional workspace" />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={submitting}
                autoComplete="email"
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                label="Password"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={submitting}
                autoComplete="current-password"
              />
            )}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" size="small" />}
                  label={<Typography variant="body2">Remember me</Typography>}
                />
              )}
            />

            <MuiLink
              component="button"
              type="button"
              variant="body2"
              onClick={() => router.push('/forgot-password')}
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
            >
              Forgot password?
            </MuiLink>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              },
            }}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </Button>
        </Stack>
      </form>

      <SocialLoginButtons />

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don&apos;t have an account yet?{' '}
          <MuiLink
            component="button"
            type="button"
            onClick={() => router.push('/register')}
            sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
          >
            Create an Account
          </MuiLink>
        </Typography>
      </Box>

      <AuthFooter />
    </Box>
  );
};

export default SignInForm;
