'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';

import { jobAlertsApi } from '@/features/job-alerts/api';
import { RecommendationDashboard } from '@/components/job-alerts/RecommendationDashboard';
import { JobRecommendation } from '@/features/job-alerts/types';

export const dynamic = 'force-dynamic';

export default function JobRecommendationsPage() {
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['job-recommendations'],
    queryFn: () => jobAlertsApi.getJobRecommendations(),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ job_id, action_type }: { job_id: string; action_type: any }) =>
      jobAlertsApi.submitFeedback({ job_id, action_type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-recommendations'] }),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <RecommendationDashboard
      recommendations={recommendations}
      onApply={(rec) => alert(`Applying to position: ${rec.title} at ${rec.company_name}`)}
      onSaveToggle={(rec) => alert(`Toggled bookmark for ${rec.title}`)}
      onFeedback={(rec, action) => feedbackMutation.mutate({ job_id: rec.job_id, action_type: action })}
    />
  );
}
