'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';

import { jobAlertsApi } from '@/features/job-alerts/api';
import { JobAlertsDashboard } from '@/components/job-alerts/JobAlertsDashboard';
import { JobAlert, SavedSearch } from '@/features/job-alerts/types';

export const dynamic = 'force-dynamic';

export default function JobAlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['job-alerts'],
    queryFn: () => jobAlertsApi.getJobAlerts(),
  });

  const { data: searches = [] } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => jobAlertsApi.getSavedSearches(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['alert-history'],
    queryFn: () => jobAlertsApi.getAlertHistory(),
  });

  const createAlertMutation = useMutation({
    mutationFn: (payload: Partial<JobAlert>) => jobAlertsApi.createJobAlert(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-alerts'] }),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<JobAlert> }) =>
      jobAlertsApi.updateJobAlert(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-alerts'] }),
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => jobAlertsApi.deleteJobAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-alerts'] }),
  });

  const togglePauseMutation = useMutation({
    mutationFn: (alert: JobAlert) =>
      alert.is_active ? jobAlertsApi.pauseJobAlert(alert.id) : jobAlertsApi.resumeJobAlert(alert.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-alerts'] }),
  });

  const createSearchMutation = useMutation({
    mutationFn: (payload: Partial<SavedSearch>) => jobAlertsApi.createSavedSearch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const updateSearchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SavedSearch> }) =>
      jobAlertsApi.updateSavedSearch(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (id: string) => jobAlertsApi.deleteSavedSearch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  if (isLoadingAlerts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <JobAlertsDashboard
      alerts={alerts}
      searches={searches}
      history={history}
      onCreateAlert={(payload) => createAlertMutation.mutate(payload)}
      onUpdateAlert={(id, payload) => updateAlertMutation.mutate({ id, payload })}
      onDeleteAlert={(id) => deleteAlertMutation.mutate(id)}
      onTogglePauseAlert={(alert) => togglePauseMutation.mutate(alert)}
      onCreateSearch={(payload) => createSearchMutation.mutate(payload)}
      onUpdateSearch={(id, payload) => updateSearchMutation.mutate({ id, payload })}
      onDeleteSearch={(id) => deleteSearchMutation.mutate(id)}
    />
  );
}
