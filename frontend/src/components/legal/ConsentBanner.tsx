'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Stack, Paper, useTheme } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';

interface ConsentBannerProps {
  onCustomize?: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onCustomize }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleAcceptAll = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify({ necessary: true, preferences: true, analytics: true, functional: true }));
    setVisible(false);
  };

  const handleRejectOptional = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify({ necessary: true, preferences: false, analytics: false, functional: false }));
    setVisible(false);
  };

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 'auto' },
        maxWidth: { sm: 520 },
        zIndex: 1400,
        p: 3,
        borderRadius: '24px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CookieIcon sx={{ color: '#6366f1', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Cookie &amp; Privacy Preferences
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          We use necessary cookies for authentication and security, and optional preference cookies to personalize your Kirmya career experience.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAcceptAll}
            sx={{ borderRadius: '12px', fontWeight: 800, px: 2.5 }}
          >
            Accept All
          </Button>
          <Button
            variant="outlined"
            onClick={handleRejectOptional}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Reject Optional
          </Button>
          {onCustomize && (
            <Button
              variant="text"
              onClick={onCustomize}
              sx={{ fontWeight: 700 }}
            >
              Customize
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ConsentBanner;
