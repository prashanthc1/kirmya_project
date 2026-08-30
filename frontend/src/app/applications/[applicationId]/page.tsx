'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Skeleton, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { ApplicationDetails } from '../../../components/applications/ApplicationDetails';
import { applicationsApi } from '../../../features/applications/api';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const applicationId = resolvedParams?.applicationId || '';

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.getApplicationByID(applicationId),
    enabled: !!applicationId,
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
        ) : isError || !application ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Error loading application details.
          </Alert>
        ) : (
          <ApplicationDetails application={application} />
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
