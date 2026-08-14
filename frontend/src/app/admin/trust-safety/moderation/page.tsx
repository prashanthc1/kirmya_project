'use client';

import React from 'react';
import ModerationQueue from '@/components/admin/trust-safety/ModerationQueue';
import { Box, Typography } from '@mui/material';

export default function AdminModerationPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Moderation Enforcement Queue
      </Typography>
      <ModerationQueue />
    </Box>
  );
}
