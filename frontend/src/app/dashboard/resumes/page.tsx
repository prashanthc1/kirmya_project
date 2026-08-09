'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';
import { ResumeDashboard } from '@/components/resume/ResumeDashboard';
import { ResumeShareDialog } from '@/components/resume/ResumeShareDialog';
import { Resume, ResumeShare } from '@/features/resume/types';

export const dynamic = 'force-dynamic';

export default function ResumesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [shareResumeItem, setShareResumeItem] = useState<Resume | null>(null);
  const [shareInfo, setShareInfo] = useState<ResumeShare | null>(null);

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.getResumes(),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => resumeApi.duplicateResume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeApi.deleteResume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => resumeApi.setDefaultResume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const handleShareGenerate = async (privacyLevel: string) => {
    if (!shareResumeItem) return;
    try {
      const res = await resumeApi.shareResume(shareResumeItem.id, privacyLevel);
      setShareInfo(res);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ResumeDashboard
        resumes={resumes}
        onCreate={() => router.push('/dashboard/resumes/create')}
        onImport={() => router.push('/dashboard/resumes/import')}
        onBrowseTemplates={() => router.push('/dashboard/resumes/templates')}
        onEdit={(res) => router.push(`/dashboard/resumes/${res.id}/edit`)}
        onPreview={(res) => router.push(`/dashboard/resumes/${res.id}/preview`)}
        onDuplicate={(res) => duplicateMutation.mutate(res.id)}
        onDownload={(res) => window.open(resumeApi.downloadResumeUrl(res.id), '_blank')}
        onSetDefault={(res) => setDefaultMutation.mutate(res.id)}
        onShare={(res) => {
          setShareResumeItem(res);
          setShareInfo(null);
        }}
        onDelete={(res) => deleteMutation.mutate(res.id)}
      />

      <ResumeShareDialog
        open={Boolean(shareResumeItem)}
        onClose={() => setShareResumeItem(null)}
        shareInfo={shareInfo}
        onGenerateShare={handleShareGenerate}
      />
    </>
  );
}
