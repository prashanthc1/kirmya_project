'use client';

import React from 'react';
import SafetyRulesManager from '@/components/admin/trust-safety/SafetyRulesManager';
import { Box, Typography } from '@mui/material';

export default function AdminRulesPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Automated Detection Safety Rules
      </Typography>
      <SafetyRulesManager />
    </Box>
  );
}
