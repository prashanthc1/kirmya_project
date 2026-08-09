'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';

import { applicationsApi } from '@/features/applications/api';
import { InterviewDashboard } from '@/components/applications/InterviewDashboard';

export const dynamic = 'force-dynamic';

export default function CandidateInterviewsPage() {
  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['candidate-interviews'],
    queryFn: () => applicationsApi.getInterviews(),
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <InterviewDashboard interviews={interviews} />
      )}
    </Container>
  );
}
