'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsCard from './AnalyticsCard';
import FunnelChart from './FunnelChart';
import analyticsApi from '@/features/analytics/services/analyticsApi';
import { RecruiterHiringAnalytics } from '@/features/analytics/types';

export default function RecruiterAnalytics() {
  const [data, setData] = useState<RecruiterHiringAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getRecruiterAnalytics().then(setData).catch(() => {});
  }, []);

  const defaultFunnel = [
    { stage: 'Applied', count: 1280, percentage: 100 },
    { stage: 'Reviewed', count: 420, percentage: 32.8 },
    { stage: 'Interviewed', count: 140, percentage: 10.9 },
    { stage: 'Offered', count: 28, percentage: 2.2 },
    { stage: 'Hired', count: 12, percentage: 0.9 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
        Recruiter & Talent Acquisition Intelligence
      </Typography>
      <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
        Isolated recruitment pipeline performance, candidate conversion velocity, and job metrics.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Jobs Posted" value={data?.jobs_posted_count ?? 8} icon={<WorkIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Applications Received" value={data?.applications_count ?? 1280} change="+24.2%" icon={<PeopleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Candidates Screened" value={data?.candidates_viewed_count ?? 420} change="32.8% conversion" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Avg Review Time" value={`${data?.avg_time_to_review_hours ?? 18.5} hrs`} change="-3.2 hrs faster" isPositive={true} />
        </Grid>
      </Grid>

      <FunnelChart title="Candidate Hiring Pipeline Funnel" stages={data?.application_funnel ?? defaultFunnel} />
    </Container>
  );
}
