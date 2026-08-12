'use client';

import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../../app/providers';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <IconButton
      onClick={toggleColorMode}
      aria-label="Toggle dark and light theme"
      size="medium"
      sx={{
        color: mode === 'dark' ? '#f8fafc' : '#1e293b',
        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        transition: surfaceTransition(0.2),
        '&:hover': {
          bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
          transform: 'scale(1.05)',
        },
      }}
    >
      {mode === 'dark' ? <LightModeIcon fontSize="small" sx={{ color: '#fbbf24' }} /> : <DarkModeIcon fontSize="small" sx={{ color: '#6366f1' }} />}
    </IconButton>
  );
};

export default ThemeToggle;
