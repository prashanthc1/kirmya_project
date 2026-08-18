'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import DataQualityDashboard from '@/components/privacy/DataQualityDashboard';

export default function AdminDataQualityPage() {
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <QueryStatsIcon sx={{ color: 'primary.main', fontSize: 38 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Enterprise Data Quality & Anomaly Monitor
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Continuous validation rules across database schemas, completeness metrics, and formatting checks.
          </Typography>
        </Box>
      </Stack>

      <DataQualityDashboard />
    </Box>
  );
}
