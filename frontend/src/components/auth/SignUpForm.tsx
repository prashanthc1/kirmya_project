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
  IconButton,
  Alert,
  Typography,
  CircularProgress,
  Link as MuiLink,
  Grid,
  MenuItem,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

import AuthHeader from './AuthHeader';
import SocialLoginButtons from './SocialLoginButtons';
import PasswordStrength from './PasswordStrength';
import AuthFooter from './AuthFooter';
import { useRegister } from '../../hooks/useRegister';

// Zod Validation Schema
const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    country: z.string().optional(),
    currentLocation: z.string().optional(),
    jobTitle: z.string().optional(),
    employmentStatus: z.string().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service' }),
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

const employmentOptions = [
  'Full-time Employee',
  'Part-time Employee',
  'Self-Employed / Freelancer',
  'Entrepreneur / Business Owner',
  'Student / Graduate',
  'Actively Seeking Opportunities',
];

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const { register, submitting, error, setError, successData } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      country: 'United Arab Emirates',
      currentLocation: 'Dubai',
      jobTitle: '',
      employmentStatus: 'Full-time Employee',
      acceptTerms: true,
      acceptPrivacy: true,
      subscribeCareerUpdates: true,
    },
  });

  const watchPassword = watch('password', '');

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      setError(null);
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
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

  // Success Screen when account is created
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
          Account Created Successfully!
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We have sent a verification email to{' '}
          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {watch('email')}
          </Box>
          . Please verify your email address to activate your profile.
        </Typography>

        {successData.verificationToken && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: '12px' }}>
            <Typography variant="caption" display="block" sx={{ fontWeight: 700 }}>
              Dev Direct Verification Token:
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
            onClick={() => router.push('/auth/signin')}
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
            Resend Email Verification
          </Button>
        </Stack>

        <AuthFooter />
      </Box>
    );
  }

  return (
    <Box>
      <AuthHeader title="Join Kirmya Network" subtitle="Create your verified professional account in 2 minutes" />

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
              <TextField
                {...field}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={submitting}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                }}
              />
            )}
          />

          <PasswordStrength password={watchPassword} />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={submitting}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label="toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                }}
              />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="jobTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Job Title / Role"
                    fullWidth
                    variant="outlined"
                    disabled={submitting}
                    placeholder="e.g. Software Engineer"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="employmentStatus"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Employment Status" fullWidth variant="outlined" disabled={submitting}>
                    {employmentOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
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
                  <TextField {...field} label="Country" fullWidth variant="outlined" disabled={submitting} />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="currentLocation"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="City / Location" fullWidth variant="outlined" disabled={submitting} />
                )}
              />
            </Grid>
          </Grid>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" size="small" />}
                  label={
                    <Typography variant="body2">
                      I accept the{' '}
                      <MuiLink href="#" underline="hover" color="primary.main">
                        Terms of Service
                      </MuiLink>
                    </Typography>
                  }
                />
              )}
            />
            {errors.acceptTerms && (
              <Typography variant="caption" color="error" sx={{ ml: 3 }}>
                {errors.acceptTerms.message}
              </Typography>
            )}

            <Controller
              name="acceptPrivacy"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" size="small" />}
                  label={
                    <Typography variant="body2">
                      I accept the{' '}
                      <MuiLink href="#" underline="hover" color="primary.main">
                        Privacy Policy
                      </MuiLink>
                    </Typography>
                  }
                />
              )}
            />
            {errors.acceptPrivacy && (
              <Typography variant="caption" color="error" sx={{ ml: 3 }}>
                {errors.acceptPrivacy.message}
              </Typography>
            )}

            <Controller
              name="subscribeCareerUpdates"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" size="small" />}
                  label={<Typography variant="body2" color="text.secondary">Subscribe to AI career trajectory recommendations</Typography>}
                />
              )}
            />
          </Stack>

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

      <SocialLoginButtons />

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <MuiLink
            component="button"
            type="button"
            onClick={() => router.push('/auth/signin')}
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
