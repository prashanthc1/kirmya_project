'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import { useRouter } from 'next/navigation';
import { useColorMode } from '../../app/providers';

interface LayoutProps {
  children: React.ReactNode;
}

export const CompanyDirectoryLayout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const router = useRouter();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
        pb: 10,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Banner Header */}
      <Box
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(238, 242, 255, 0.9) 0%, rgba(241, 245, 249, 0.95) 100%)',
          pt: 4,
          pb: 6,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          mb: 5,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/')}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Back to Kirmya
            </Button>

            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Stack>

          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ maxWidth: 800, mx: 'auto' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              }}
            >
              <BusinessIcon sx={{ color: '#ffffff', fontSize: 36 }} />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
              Explore Verified Employers &amp; Companies
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: 640 }}>
              Discover top hiring companies, corporate cultures, verified employee reviews, and AI-matched career opportunities across global markets.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl">{children}</Container>
    </Box>
  );
};

export default CompanyDirectoryLayout;
