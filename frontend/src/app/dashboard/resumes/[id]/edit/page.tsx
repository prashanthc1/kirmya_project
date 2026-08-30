'use client';

import React, { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Box, Skeleton, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../../../components/shell/AuthenticatedLayout';
import { resumeApi } from '../../../../../features/resume/api';
import { ResumeEditor } from '../../../../../components/resume/ResumeEditor';
import { tokens } from '../../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ResumeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = resolvedParams?.id || '';

  const { data: resume, isLoading, isError } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getResume(id),
    enabled: !!id,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['resume-versions', id],
    queryFn: () => resumeApi.getVersions(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (sections: any[]) => resumeApi.updateSections(id, sections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resume', id] }),
  });

  const optimizeMutation = useMutation({
    mutationFn: () => resumeApi.optimizeResume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resume', id] }),
  });

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/dashboard/resumes/${id}`)}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Resume Details
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : isError || !resume ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Failed to load resume editor.
          </Alert>
        ) : (
          <ResumeEditor
            resume={resume}
            onSave={(sections) => updateMutation.mutate(sections)}
            onOptimize={() => optimizeMutation.mutate()}
            onDownload={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')}
            versions={versions}
          />
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
