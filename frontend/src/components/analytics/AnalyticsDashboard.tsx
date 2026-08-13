'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsCard from './AnalyticsCard';
import AnalyticsChart from './AnalyticsChart';
import AnalyticsFilters from './AnalyticsFilters';
import CohortTable from './CohortTable';
import AnalyticsExportModal from './AnalyticsExportModal';
import analyticsApi from '@/features/analytics/services/analyticsApi';
import { AdminAnalyticsOverview } from '@/features/analytics/types';

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [dateRange, setDateRange] = useState('30D');
  const [orgFilter, setOrgFilter] = useState('all');
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    analyticsApi.getAdminOverview().then(setOverview).catch(() => {});
  }, []);

  const userGrowthTrend = [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 5800 },
    { label: 'Mar', value: 7400 },
    { label: 'Apr', value: 9100 },
    { label: 'May', value: 10800 },
    { label: 'Jun', value: 12450 },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>
            Platform Product Intelligence & Executive Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Data Freshness: {overview?.data_freshness_timestamp ? new Date(overview.data_freshness_timestamp).toLocaleTimeString() : 'Just now'} • Latency: {overview?.event_processing_latency_ms ?? 4.2}ms
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => setExportOpen(true)}
          sx={{ bgcolor: '#0284c7', color: '#fff', fontWeight: 'bold', borderRadius: 2 }}
        >
          Export Data
        </Button>
      </Box>

      <AnalyticsFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        orgFilter={orgFilter}
        onOrgFilterChange={setOrgFilter}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Total Platform Users" value={overview?.total_users ?? 12450} change="+14.5%" icon={<PeopleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Active DAU / MAU" value={`${overview?.active_users_dau ?? 4150} / ${overview?.active_users_mau ?? 12450}`} subtitle="33.3% stickiness" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Total Job Openings" value={overview?.total_jobs ?? 1840} change="+8.2%" icon={<WorkIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="AI Career Requests" value={overview?.total_ai_requests ?? 62250} change="+45.0%" icon={<AutoAwesomeIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Job Applications" value={overview?.total_applications ?? 18920} change="+22.1%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Messages Exchanged" value={overview?.total_messages ?? 142800} change="+18.9%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Safety Incidents" value={overview?.total_safety_reports ?? 24} change="-14.2%" isPositive={true} icon={<SecurityIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard title="Verified Users" value={overview?.verified_users ?? 9840} subtitle="79% of platform base" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <AnalyticsChart title="User Growth & Acquisition Trajectory" subtitle="Total registered active accounts" data={userGrowthTrend} />
        </Grid>
        <Grid item xs={12} md={5}>
          <CohortTable />
        </Grid>
      </Grid>

      <AnalyticsExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </Container>
  );
}
