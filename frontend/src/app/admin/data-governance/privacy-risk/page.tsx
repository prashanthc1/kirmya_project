'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import PrivacyRiskDashboard from '@/components/privacy/PrivacyRiskDashboard';

export default function AdminPrivacyRiskPage() {
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <ShieldIcon sx={{ color: 'success.main', fontSize: 38 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Privacy Risk Scorecard & Framework Matrix
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Continuous enterprise exposure risk index and regulatory readiness scorecards.
          </Typography>
        </Box>
      </Stack>

      <PrivacyRiskDashboard />
    </Box>
  );
}
