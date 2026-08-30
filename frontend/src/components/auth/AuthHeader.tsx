'use client';

import React from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
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

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <BrandLockup size={40} variant="h5" />

        <IconButton
          onClick={toggleColorMode}
          aria-label="Toggle color mode"
          size="small"
          sx={{
            color: 'text.secondary',
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        </IconButton>
      </Stack>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
};

export default AuthHeader;
