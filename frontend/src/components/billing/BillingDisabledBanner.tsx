'use client';

import React from 'react';
import { Alert, Typography, Box, Stack } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export const BillingDisabledBanner: React.FC = () => {
  return (
    <Alert
      severity="info"
      icon={<LockOpenIcon sx={{ color: '#10b981' }} />}
      sx={{
        borderRadius: '16px',
        mb: 3,
        bgcolor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10b981' }}>
          Kirmya is 100% Free
        </Typography>
        <Typography variant="caption" color="text.secondary">
          No credit card, subscription, or payment is required. All features are fully unlocked for job seekers, recruiters, and companies.
        </Typography>
      </Stack>
    </Alert>
  );
};

export default BillingDisabledBanner;
