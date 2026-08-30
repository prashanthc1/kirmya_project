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
  Stack,
  Alert,
  Typography,
  CircularProgress,
  Link as MuiLink,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import Link from 'next/link';

import AuthHeader from './AuthHeader';
import PasswordInput from './PasswordInput';
import PasswordStrengthIndicator from './PasswordStrength';
import AuthFooter from './AuthFooter';
import { useRegister } from '../../hooks/useRegister';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

// Lightweight Registration Schema
const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms of Service and Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormInputs = z.infer<typeof signUpSchema>;

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const { register, submitting, error, setError } = useRegister();
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as any,
    },
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      setError(null);
      const normalizedEmail = data.email.trim().toLowerCase();

      const res = await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: normalizedEmail,
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: true,
        acceptPrivacy: true,
      });

      if (res?.email_verification_required) {
        setVerificationSentEmail(normalizedEmail);
      } else {
        router.push(ROUTES.ONBOARDING);
      }
    } catch {
      // Handled via useRegister error state
    }
  };

  if (verificationSentEmail) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          Check your email
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          We sent a verification link to <strong>{verificationSentEmail}</strong>. Please click the link to verify your account and begin onboarding.
        </Typography>

        <Stack spacing={2}>
          <Button
            component={Link}
            href={`/verification?email=${encodeURIComponent(verificationSentEmail)}`}
            variant="contained"
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: `${tokens.radius.md}px` }}
          >
            Go to Verification Page
          </Button>

          <Button
            component={Link}
            href="/login"
            variant="outlined"
            fullWidth
            sx={{ py: 1.3, fontWeight: 600, borderRadius: `${tokens.radius.md}px` }}
          >
            Back to Sign In
          </Button>
        </Stack>

        <AuthFooter />
      </Box>
    );
  }

  return (
    <Box>
      <AuthHeader
        title="Create your account"
        subtitle="Join Kirmya to advance your career and connect with opportunities."
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.25}>
          {/* First & Last Name */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    placeholder="Jane"
                    fullWidth
                    variant="outlined"
                    autoComplete="given-name"
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName?.message}
                    disabled={submitting}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    placeholder="Doe"
                    fullWidth
                    variant="outlined"
                    autoComplete="family-name"
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName?.message}
                    disabled={submitting}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Email Input */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                placeholder="name@example.com"
                fullWidth
                variant="outlined"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                disabled={submitting}
              />
            )}
          />

          {/* Password Input */}
          <Box>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  {...field}
                  label="Password (min 12 characters)"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  disabled={submitting}
                />
              )}
            />
            <PasswordStrengthIndicator password={watchedPassword} />
          </Box>

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                label="Confirm Password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
                disabled={submitting}
              />
            )}
          />

          {/* Terms & Privacy Agreement */}
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Box>
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
                    <Typography variant="caption" color="text.secondary">
                      I agree to the{' '}
                      <MuiLink component={Link} href="/terms" underline="hover" color="primary">
                        Terms of Service
                      </MuiLink>{' '}
                      and{' '}
                      <MuiLink component={Link} href="/privacy" underline="hover" color="primary">
                        Privacy Policy
                      </MuiLink>
                      .
                    </Typography>
                  }
                />
                {errors.acceptTerms && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                    {errors.acceptTerms.message}
                  </Typography>
                )}
              </Box>
            )}
          />

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
                <span>Creating account...</span>
              </Stack>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink
                component={Link}
                href="/login"
                color="primary"
                underline="hover"
                sx={{ fontWeight: 700 }}
              >
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Stack>
      </form>

      <AuthFooter />
    </Box>
  );
};

export default SignUpForm;
