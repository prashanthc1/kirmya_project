'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';

import { jobAlertsApi } from '@/features/job-alerts/api';
import { SavedSearchManager } from '@/components/job-alerts/SavedSearchManager';
import { SavedSearch } from '@/features/job-alerts/types';

export const dynamic = 'force-dynamic';

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => jobAlertsApi.getSavedSearches(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<SavedSearch>) => jobAlertsApi.createSavedSearch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SavedSearch> }) =>
      jobAlertsApi.updateSavedSearch(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobAlertsApi.deleteSavedSearch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SavedSearchManager
          searches={searches}
          onCreateSearch={(payload) => createMutation.mutate(payload)}
          onUpdateSearch={(id, payload) => updateMutation.mutate({ id, payload })}
          onDeleteSearch={(id) => deleteMutation.mutate(id)}
        />
      )}
    </Container>
  );
}
