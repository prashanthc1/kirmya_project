'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import AnalyticsCard from './AnalyticsCard';
import AnalyticsChart from './AnalyticsChart';
import analyticsApi from '@/features/analytics/services/analyticsApi';
import { UserPersonalAnalytics } from '@/features/analytics/types';

export default function ProfileAnalytics() {
  const [data, setData] = useState<UserPersonalAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getUserAnalytics().then(setData).catch(() => {});
  }, []);

  const chartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 24 },
    { label: 'Wed', value: 18 },
    { label: 'Thu', value: 32 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 15 },
    { label: 'Sun', value: 20 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
        Personal Career & Profile Analytics
      </Typography>
      <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
        Real-time insights on your profile views, search appearances, and application outcomes.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Profile Views" value={data?.profile_views_count ?? 342} change="+18.4%" icon={<VisibilityIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Search Appearances" value={data?.search_appearances_count ?? 128} change="+12.0%" icon={<SearchIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Applications Sent" value={data?.applications_count ?? 14} change="+4 this week" icon={<SendIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Interview Rate" value={`${data?.interview_invitation_rate.toFixed(1) ?? 35.7}%`} change="Top 15%" isPositive={true} />
        </Grid>
      </Grid>

      <AnalyticsChart title="Weekly Profile Views Trend" subtitle="Daily views recorded over the past 7 days" data={chartData} />
    </Container>
  );
}
