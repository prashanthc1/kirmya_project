'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Stack } from '@mui/material';

import { jobAlertsApi } from '@/features/job-alerts/api';
import { CareerInsightsComponent } from '@/components/job-alerts/CareerInsights';
import { LearningSuggestions } from '@/components/job-alerts/LearningSuggestions';

export const dynamic = 'force-dynamic';

export default function CareerInsightsPage() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['career-insights'],
    queryFn: () => jobAlertsApi.getCareerInsights(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <CareerInsightsComponent insights={insights} />
        <LearningSuggestions insights={insights} />
      </Stack>
    </Container>
  );
}
