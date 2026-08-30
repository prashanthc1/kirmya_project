'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Button, Box, Skeleton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { applicationsApi } from '../../../../features/applications/api';
import { ApplicationDetails } from '../../../../components/applications/ApplicationDetails';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = resolvedParams?.id || '';

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

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/applications')}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Applications Tracker
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : isError || !detail ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Application not found or you are not authorized to view this record.
          </Alert>
        ) : (
          <ApplicationDetails
            application={detail}
            onWithdraw={() => {
              withdrawMutation.mutate(id);
            }}
          />
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
