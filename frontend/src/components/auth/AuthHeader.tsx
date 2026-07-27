'use client';

import React from 'react';
import { Box, Typography, IconButton, Stack, useTheme } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SecurityIcon from '@mui/icons-material/Security';
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
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            <SecurityIcon sx={{ color: '#ffffff', fontSize: 26 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background:
                mode === 'light'
                  ? 'linear-gradient(90deg, #1e293b 0%, #475569 100%)'
                  : 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            KIRMYA
          </Typography>
        </Stack>

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
