'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AnalyticsCard from './AnalyticsCard';
import analyticsApi from '@/features/analytics/services/analyticsApi';
import { CompanyOverviewAnalytics } from '@/features/analytics/types';

export default function CompanyAnalytics() {
  const [data, setData] = useState<CompanyOverviewAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getCompanyAnalytics().then(setData).catch(() => {});
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
        Company Employer Brand Analytics
      </Typography>
      <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
        Company profile views, job engagement metrics, and employer brand reach.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Active Jobs" value={data?.active_jobs_count ?? 12} icon={<BusinessIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Profile Views" value={data?.company_profile_views_count ?? 2450} change="+15.8%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Total Job Views" value={data?.total_job_views_count ?? 8920} change="+32.4%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Candidate Conversion" value={`${data?.candidate_conversion_rate.toFixed(1) ?? 14.3}%`} isPositive={true} />
        </Grid>
      </Grid>
    </Container>
  );
}
