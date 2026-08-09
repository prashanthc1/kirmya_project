'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';
import { ResumeEditor } from '@/components/resume/ResumeEditor';

export const dynamic = 'force-dynamic';

export default function ResumeEditPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getResume(id),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['resume-versions', id],
    queryFn: () => resumeApi.getVersions(id),
  });

  const updateMutation = useMutation({
    mutationFn: (sections: any[]) => resumeApi.updateSections(id, sections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resume', id] }),
  });

  const optimizeMutation = useMutation({
    mutationFn: () => resumeApi.optimizeResume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resume', id] }),
  });

  if (isLoading || !resume) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ResumeEditor
      resume={resume}
      onSave={(sections) => updateMutation.mutate(sections)}
      onOptimize={() => optimizeMutation.mutate()}
      onDownload={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')}
      versions={versions}
    />
  );
}
