'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Stack, Typography, Button, IconButton, useTheme } from '@mui/material';
import BrandLockup from '../brand/BrandLockup';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ThemeToggle from '../landing/ThemeToggle';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  onSaveProgress?: () => void;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, onSaveProgress }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Bar */}
      <Box
        component="header"
        sx={{
          py: 2,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(16px)',
          bgcolor: isDark ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* Logo */}
            <BrandLockup
              size={38}
              variant="h6"
              suffix={
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                  ONBOARDING
                </Typography>
              }
            />

            {/* Right Action Tools */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {onSaveProgress && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<BookmarkIcon fontSize="small" />}
                  onClick={onSaveProgress}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  Save & Resume Later
                </Button>
              )}

              <ThemeToggle />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="md">{children}</Container>
      </Box>
    </Box>
  );
};

export default OnboardingLayout;
