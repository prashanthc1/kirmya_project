'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CandidateJobDashboard } from '@/components/applications/CandidateJobDashboard';
import { applicationsApi } from '@/features/applications/api';
import { Box, CircularProgress } from '@mui/material';

export default function DashboardJobsPage() {
  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications()
  });

  const { data: savedJobs = [], isLoading: isLoadingSaved } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => applicationsApi.getSavedJobs()
  });

  const { data: interviews = [], isLoading: isLoadingInt } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => applicationsApi.getInterviews()
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => applicationsApi.getAnalytics()
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: () => applicationsApi.getAIInsights()
  });

  const isLoading = isLoadingApps || isLoadingSaved || isLoadingInt || isLoadingAnalytics || isLoadingInsights;

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <CandidateJobDashboard 
      applications={applications}
      savedJobs={savedJobs}
      interviews={interviews}
      analytics={analytics}
      insights={insights}
    />
  );
}
