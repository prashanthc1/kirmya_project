'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container } from '@mui/material';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { applicationsApi } from '../../../features/applications/api';
import { ApplicationDashboard } from '../../../components/applications/ApplicationDashboard';

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['applications-analytics'],
    queryFn: () => applicationsApi.getAnalytics(),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleSelectApplication = (id: string) => {
    router.push(`/dashboard/applications/${id}`);
  };

  const handleWithdraw = (id: string) => {
    withdrawMutation.mutate(id);
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <ApplicationDashboard
          applications={applications}
          stats={analyticsData?.stats}
          isLoading={isLoadingApps}
          onSelectApplication={handleSelectApplication}
          onWithdrawApplication={handleWithdraw}
        />
      </Container>
    </AuthenticatedLayout>
  );
}
