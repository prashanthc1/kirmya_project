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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const CompanyDirectoryLayout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
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
          bgcolor: isDark
            ? "background.paper"
            : "background.paper",
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
          </Stack>

          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ maxWidth: 800, mx: 'auto' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                bgcolor: "primary.main",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                boxShadow: "none",
              }}
            >
              <BusinessIcon sx={{ color: "text.primary", fontSize: 36 }} />
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
