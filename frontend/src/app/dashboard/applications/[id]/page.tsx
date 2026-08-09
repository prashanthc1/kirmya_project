'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Button, Box, CircularProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { applicationsApi } from '@/features/applications/api';
import { ApplicationDetails } from '@/components/applications/ApplicationDetails';

export const dynamic = 'force-dynamic';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['application-detail', id],
    queryFn: () => applicationsApi.getApplicationByID(id),
    enabled: !!id,
  });

  const withdrawMutation = useMutation({
    mutationFn: (appId: string) => applicationsApi.withdrawApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !detail) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h6" color="error">
          Application not found.
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/applications')} sx={{ mt: 2 }}>
          Back to Applications
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/applications')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Applications Tracker
        </Button>
      </Box>

      <ApplicationDetails
        detail={detail}
        onWithdraw={() => {
          if (confirm('Are you sure you want to withdraw this application?')) {
            withdrawMutation.mutate(id);
          }
        }}
      />
    </Container>
  );
}
