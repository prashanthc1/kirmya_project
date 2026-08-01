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
  MenuItem,
  Avatar,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

import AuthHeader from './AuthHeader';
import PasswordInput from './PasswordInput';
import PasswordStrengthIndicator from './PasswordStrength';
import SocialSignupButtons from './SocialSignupButtons';
import TermsAgreement from './TermsAgreement';
import AuthFooter from './AuthFooter';
import { useRegister } from '../../hooks/useRegister';

// Zod Validation Schema matching exact prompt requirements
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
    country: z.string().min(1, 'Country is required'),
    currentLocation: z.string().min(1, 'Current location is required'),
    employmentStatus: z.string().min(1, 'Professional status is required'),
    jobTitle: z.string().min(1, 'Current or target job title is required'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms of Service and Privacy Policy' }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Privacy Policy' }),
    }),
    subscribeCareerUpdates: z.boolean().optional().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormInputs = z.infer<typeof signUpSchema>;

const professionalStatusOptions = [
  'Looking for a job',
  'Currently employed',
  'Freelancer',
  'Student',
  'Entrepreneur',
];

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const { register, submitting, error, setError, successData } = useRegister();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: 'United Arab Emirates',
      currentLocation: 'Dubai',
      employmentStatus: 'Looking for a job',
      jobTitle: '',
      acceptTerms: true,
      acceptPrivacy: true,
      subscribeCareerUpdates: true,
    },
  });

  const watchPassword = watch('password', '');
  const watchAcceptTerms = watch('acceptTerms', true);
  const watchSubscribeUpdates = watch('subscribeCareerUpdates', true);

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      setError(null);
      // Email lowercase normalization
      const normalizedEmail = data.email.trim().toLowerCase();

      await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: normalizedEmail,
        password: data.password,
        confirmPassword: data.confirmPassword,
        country: data.country,
        currentLocation: data.currentLocation,
        jobTitle: data.jobTitle,
        employmentStatus: data.employmentStatus,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
        subscribeCareerUpdates: data.subscribeCareerUpdates,
      });
    } catch {
      // Handled in useRegister hook
    }
  };

  // Verification Screen upon successful account creation
  if (successData) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'success.main',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
          }}
        >
          <MarkEmailReadIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Avatar>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Verify Your Kirmya Account
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We have sent a verification email to{' '}
          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {watch('email')}
          </Box>
          . Please verify your email address to complete your account setup.
        </Typography>

        {successData.verificationToken && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: '12px' }}>
            <Typography variant="caption" display="block" sx={{ fontWeight: 700 }}>
              Verification Token (Dev Sandbox):
            </Typography>
            <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {successData.verificationToken}
            </Typography>
          </Alert>
        )}

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => router.push('/signin')}
            sx={{
              py: 1.4,
              borderRadius: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            Proceed to Sign In
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => alert('Verification email resent successfully.')}
            sx={{ py: 1.2, borderRadius: '12px', textTransform: 'none' }}
          >
            Resend Verification Email
          </Button>
        </Stack>

        <AuthFooter />
      </Box>
    );
  }

  return (
    <Box>
      <AuthHeader title="Create your Kirmya account" subtitle="Start rebuilding your career journey today" />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    variant="outlined"
                    error={!!errors.firstName}
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
                    fullWidth
                    variant="outlined"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    disabled={submitting}
                  />
                )}
              />
            </Grid>
          </Grid>

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
                autoComplete="new-password"
              />
            )}
          />

          <PasswordStrengthIndicator password={watchPassword} />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                label="Confirm Password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={submitting}
                autoComplete="new-password"
              />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="employmentStatus"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Professional Status"
                    fullWidth
                    variant="outlined"
                    error={!!errors.employmentStatus}
                    helperText={errors.employmentStatus?.message}
                    disabled={submitting}
                  >
                    {professionalStatusOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="jobTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Current or Target Job Title"
                    fullWidth
                    variant="outlined"
                    error={!!errors.jobTitle}
                    helperText={errors.jobTitle?.message}
                    disabled={submitting}
                    placeholder="e.g. Software Engineer"
                  />
                )}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country"
                    fullWidth
                    variant="outlined"
                    error={!!errors.country}
                    helperText={errors.country?.message}
                    disabled={submitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="currentLocation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Current Location / City"
                    fullWidth
                    variant="outlined"
                    error={!!errors.currentLocation}
                    helperText={errors.currentLocation?.message}
                    disabled={submitting}
                  />
                )}
              />
            </Grid>
          </Grid>

          <TermsAgreement
            acceptTerms={watchAcceptTerms}
            onAcceptTermsChange={(val) => {
              setValue('acceptTerms', val as any, { shouldValidate: true });
              setValue('acceptPrivacy', val as any, { shouldValidate: true });
            }}
            acceptTermsError={errors.acceptTerms?.message}
            subscribeCareerUpdates={watchSubscribeUpdates}
            onSubscribeCareerUpdatesChange={(val) => setValue('subscribeCareerUpdates', val)}
            disabled={submitting}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddOutlinedIcon />}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)',
              },
            }}
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Stack>
      </form>

      <SocialSignupButtons />

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <MuiLink
            component="button"
            type="button"
            onClick={() => router.push('/signin')}
            sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign In
          </MuiLink>
        </Typography>
      </Box>

      <AuthFooter />
    </Box>
  );
};

export default SignUpForm;
