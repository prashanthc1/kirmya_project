'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { applicationsApi } from '../../../features/applications/api';
import { InterviewDashboard } from '../../../components/applications/InterviewDashboard';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CandidateInterviewsPage() {
  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['candidate-interviews'],
    queryFn: () => applicationsApi.getInterviews(),
  });

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : (
          <InterviewDashboard interviews={interviews} />
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
