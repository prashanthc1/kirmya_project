'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Link from 'next/link';

import AuthHeader from './AuthHeader';
import PasswordInput from './PasswordInput';
import AuthFooter from './AuthFooter';
import { useLogin } from '../../hooks/useLogin';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

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

// Validate returnUrl to avoid open redirects
function getSafeReturnUrl(returnUrl: string | null): string {
  if (!returnUrl) return ROUTES.FEED;
  // Disallow absolute URLs, scheme-relative URLs, or protocol specifications
  if (
    returnUrl.startsWith('/') &&
    !returnUrl.startsWith('//') &&
    !returnUrl.includes('://')
  ) {
    return returnUrl;
  }
  return ROUTES.FEED;
}

export const SignInForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');
  const safeReturnUrl = getSafeReturnUrl(rawReturnUrl);

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

      const normalizedEmail = data.email.trim().toLowerCase();

      const res = await login({
        email: normalizedEmail,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      setSuccessMessage('Authentication successful. Redirecting...');

      const userRole = (res?.user?.roleId || 'candidate').toLowerCase();
      setTimeout(() => {
        if (rawReturnUrl) {
          router.push(safeReturnUrl);
        } else if (userRole.includes('admin') || userRole === 'platform_admin') {
          router.push(ROUTES.ADMIN.ROOT);
        } else if (userRole.includes('company')) {
          router.push(ROUTES.COMPANY_DASHBOARD);
        } else if (userRole.includes('recruiter')) {
          router.push(ROUTES.RECRUITER.DASHBOARD);
        } else {
          router.push(ROUTES.FEED);
        }
      }, 400);
    } catch {
      // Handled via useLogin error state
    }
  };

  return (
    <Box>
      <AuthHeader
        title="Sign In to Kirmya"
        subtitle="Enter your credentials to access your professional workspace."
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: `${tokens.radius.sm}px` }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2.5, borderRadius: `${tokens.radius.sm}px` }}
        >
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {/* Email Input */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                placeholder="name@company.com"
                fullWidth
                variant="outlined"
                autoComplete="email"
                autoFocus
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                disabled={submitting}
              />
            )}
          />

          {/* Password Input */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                disabled={submitting}
              />
            )}
          />

          {/* Remember Me & Forgot Password */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: -0.5 }}
          >
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                      size="small"
                      disabled={submitting}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Remember me
                    </Typography>
                  }
                />
              )}
            />

            <MuiLink
              component={Link}
              href="/forgot-password"
              variant="body2"
              color="primary"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Forgot password?
            </MuiLink>
          </Stack>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            sx={{
              py: 1.4,
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: `${tokens.radius.md}px`,
            }}
          >
            {submitting ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Signing in...</span>
              </Stack>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink
                component={Link}
                href="/signup"
                color="primary"
                underline="hover"
                sx={{ fontWeight: 700 }}
              >
                Create Account
              </MuiLink>
            </Typography>
          </Box>
        </Stack>
      </form>

      <AuthFooter />
    </Box>
  );
};

export default SignInForm;
