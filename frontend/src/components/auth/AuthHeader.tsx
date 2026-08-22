'use client';

import React from 'react';
import { Box, Typography, IconButton, Stack, useTheme } from '@mui/material';
import BrandLockup from '../brand/BrandLockup';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../../app/providers';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <BrandLockup size={44} variant="h5" />

        <IconButton
          onClick={toggleColorMode}
          aria-label="Toggle color mode"
          sx={{
            color: mode === 'light' ? 'text.secondary' : '#f8fafc',
            backdropFilter: 'blur(8px)',
            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
            },
          }}
        >
          {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        </IconButton>
      </Stack>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
};

export default AuthHeader;
