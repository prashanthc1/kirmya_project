'use client';

import React from 'react';
import AppealsManager from '@/components/admin/trust-safety/AppealsManager';
import { Box, Typography } from '@mui/material';

export default function AdminAppealsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Moderation Appeals Management
      </Typography>
      <AppealsManager />
    </Box>
  );
}
