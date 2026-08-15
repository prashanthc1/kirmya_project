'use client';

import React from 'react';
import IncidentManager from '@/components/admin/IncidentManager';
import { Box } from '@mui/material';

export default function AdminIncidentsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <IncidentManager />
    </Box>
  );
}
