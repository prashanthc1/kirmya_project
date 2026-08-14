'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';

import { applicationsApi } from '@/features/applications/api';
import { SavedJobs } from '@/components/applications/SavedJobs';

export const dynamic = 'force-dynamic';

export default function SavedJobsPage() {
  const queryClient = useQueryClient();

  const { data: savedJobs = [], isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => applicationsApi.getSavedJobs(),
  });

  const removeSavedMutation = useMutation({
    mutationFn: (jobId: string) => applicationsApi.removeSavedJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SavedJobs
          savedJobs={savedJobs}
          onRemove={(jobId: string) => removeSavedMutation.mutate(jobId)}
        />
      )}
    </Container>
  );
}
