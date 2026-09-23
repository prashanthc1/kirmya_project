'use client';

import React from 'react';
import { IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../../app/providers';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      onClick={toggleColorMode}
      aria-label="Toggle dark and light theme"
      size="medium"
      sx={{
        color: 'text.primary',
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
    </IconButton>
  );
};

export default ThemeToggle;
