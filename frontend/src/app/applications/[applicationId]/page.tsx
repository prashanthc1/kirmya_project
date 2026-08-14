'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApplicationDetails } from '@/components/applications/ApplicationDetails';
import { applicationsApi } from '@/features/applications/api';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const resolvedParams = React.use(params);
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['application', resolvedParams.applicationId],
    queryFn: () => applicationsApi.getApplicationByID(resolvedParams.applicationId)
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error || !application) {
    return <Typography color="error">Error loading application.</Typography>;
  }

  return <ApplicationDetails application={application} />;
}
