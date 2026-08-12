'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import AnalyticsDashboard from '../../../components/recruiter/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Recruitment Analytics &amp; Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track conversion rates, time to hire, candidate sourcing metrics, and job posting performance.
        </Typography>
      </Box>

      <AnalyticsDashboard />
    </RecruiterLayout>
  );
}
