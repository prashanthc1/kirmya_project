'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/features/applications/api';
import { ApplicationDashboard } from '@/components/applications/ApplicationDashboard';

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['applications-analytics'],
    queryFn: () => applicationsApi.getAnalytics(),
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['applications-ai-insights'],
    queryFn: () => applicationsApi.getAIInsights(),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleSelectApplication = async (id: string) => {
    return await applicationsApi.getApplicationByID(id);
  };

  const handleWithdraw = (id: string) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      withdrawMutation.mutate(id);
    }
  };

  return (
    <ApplicationDashboard
      applications={applications}
      stats={analyticsData?.stats}
      insights={aiInsights}
      isLoading={isLoadingApps}
      onSelectApplication={handleSelectApplication}
      onWithdrawApplication={handleWithdraw}
    />
  );
}
