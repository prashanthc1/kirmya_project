'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { ResumePreviewToolbar } from '@/components/resume/ResumePreviewToolbar';

export const dynamic = 'force-dynamic';

export default function ResumePreviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [zoom, setZoom] = useState(1.0);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [template, setTemplate] = useState('classic');

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getResume(id),
  });

  if (isLoading || !resume) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ResumePreviewToolbar
        zoom={zoom}
        onZoomIn={() => setZoom(Math.min(1.5, zoom + 0.1))}
        onZoomOut={() => setZoom(Math.max(0.5, zoom - 0.1))}
        deviceView={deviceView}
        onDeviceChange={setDeviceView}
        templateName={template}
        onTemplateChange={setTemplate}
        onDownload={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')}
        onPrint={() => window.print()}
      />

      <ResumePreview resume={{ ...resume, templateName: template }} zoom={zoom} deviceView={deviceView} />
    </Container>
  );
}
