'use client';

import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Stack, Button, useTheme } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';

interface CookieConsentBannerProps {
  onOpenPreferences?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPreferences }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kirmya_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify({ necessary: true, analytics: true, preferences: true, marketing: false }));
    setVisible(false);
  };

  const handleRejectOptional = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        maxWidth: 900,
        mx: 'auto',
        zIndex: 9999,
      }}
    >
      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <CookieIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                We Value Your Privacy & Choice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kirmya uses necessary cookies to secure authentication. Optional analytics cookies help optimize job search UI. No dark patterns.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button variant="outlined" color="inherit" onClick={handleRejectOptional} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
              Reject Optional
            </Button>
            {onOpenPreferences && (
              <Button variant="outlined" onClick={onOpenPreferences} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
                Customize
              </Button>
            )}
            <Button variant="contained" onClick={handleAcceptAll} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
              Accept All
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};

export default CookieConsentBanner;
