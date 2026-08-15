'use client';

import React from 'react';
import BackgroundJobManager from '@/components/admin/BackgroundJobManager';
import { Box } from '@mui/material';

export default function AdminBackgroundJobsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <BackgroundJobManager />
    </Box>
  );
}
