'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import { ApplicationDashboard } from '../../components/applications/ApplicationDashboard';
import { applicationsApi } from '../../features/applications/api';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
  });

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <ApplicationDashboard applications={applications} isLoading={isLoading} />
      </Container>
    </AuthenticatedLayout>
  );
}
