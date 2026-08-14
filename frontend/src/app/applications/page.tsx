'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApplicationDashboard } from '@/components/applications/ApplicationDashboard';
import { applicationsApi } from '@/features/applications/api';
import { Box, CircularProgress } from '@mui/material';

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications()
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return <ApplicationDashboard applications={applications} />;
}
