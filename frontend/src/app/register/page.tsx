'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useColorMode } from '../providers';
import { useAuth } from '../../features/auth/context/authContext';

export default function RegisterPage() {
  const { mode, toggleColorMode } = useColorMode();
  const { register } = useAuth();
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password validations
  const isMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]/.test(password);

  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. The email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRule = (isValid: boolean, label: string) => (
    <ListItem sx={{ p: 0, py: 0.25 }}>
      <ListItemIcon sx={{ minWidth: 28, color: isValid ? '#10b981' : '#ef4444' }}>
        {isValid ? <CheckCircleIcon sx={{ fontSize: '1.1rem' }} /> : <CancelIcon sx={{ fontSize: '1.1rem' }} />}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: 'caption',
          fontWeight: 600,
          color: isValid ? 'text.secondary' : 'text.disabled',
        }}
      />
    </ListItem>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        py: 4,
      }}
    >
      {/* Theme Toggler */}
      <IconButton
        onClick={toggleColorMode}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          color: mode === 'light' ? 'text.secondary' : '#f9fafb',
        }}
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>

      <Container maxWidth="xs">
        <Card
          sx={{
            bgcolor: mode === 'light' ? 'white' : '#111827',
            borderRadius: 3,
            boxShadow: mode === 'light' ? '0 10px 25px rgba(0,0,0,0.05)' : '0 10px 40px rgba(0,0,0,0.4)',
            border: mode === 'light' ? '1px solid #e0e0e0' : 'none',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: '#0a66c2',
                  width: 50,
                  height: 50,
                  mb: 1.5,
                  boxShadow: '0 4px 10px rgba(10, 102, 194, 0.4)',
                }}
              >
                <PersonAddIcon />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                Join Kirmya
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a professional account today
              </Typography>
            </Box>

            {success ? (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                Account created successfully! Redirecting to login...
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Email Address"
                      type="email"
                      fullWidth
                      variant="outlined"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      variant="outlined"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                    />

                    {/* Password Strength Validation Indicators */}
                    <Box sx={{ bgcolor: mode === 'light' ? '#f8fafc' : '#1e293b', p: 1.5, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.5, display: 'block' }}>
                        Password Requirements:
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {renderRule(isMinLength, 'At least 12 characters')}
                        {renderRule(hasUpper, 'At least one uppercase letter')}
                        {renderRule(hasLower, 'At least one lowercase letter')}
                        {renderRule(hasNumber, 'At least one numerical digit')}
                        {renderRule(hasSpecial, 'At least one special character (!@#$%^&*)')}
                      </List>
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={submitting || !isPasswordValid}
                      sx={{
                        bgcolor: '#0a66c2',
                        color: 'white',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 1.5,
                        fontSize: '1rem',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)',
                        '&:hover': {
                          bgcolor: '#004182',
                        },
                      }}
                    >
                      {submitting ? 'Creating Account...' : 'Agree & Join'}
                    </Button>
                  </Stack>
                </form>
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already on Kirmya?{' '}
                <span
                  onClick={() => router.push('/login')}
                  style={{ color: '#0a66c2', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign In
                </span>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
