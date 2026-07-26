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
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useColorMode } from '../providers';
import { useAuth } from '../../features/auth/context/authContext';

export default function LoginPage() {
  const { mode, toggleColorMode } = useColorMode();
  const { login } = useAuth();
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.push('/messaging'); // Redirect to messaging console on success
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
                <LockOpenIcon />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                Sign In to Kirmya
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back to your professional network
              </Typography>
            </Box>

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

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={submitting}
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
                  {submitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <span
                  onClick={() => router.push('/register')}
                  style={{ color: '#0a66c2', fontWeight: 700, cursor: 'pointer' }}
                >
                  Join now
                </span>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
