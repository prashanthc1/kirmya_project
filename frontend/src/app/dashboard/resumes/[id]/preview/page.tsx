'use client';

import React, { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Skeleton, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../../../components/shell/AuthenticatedLayout';
import { resumeApi } from '../../../../../features/resume/api';
import { ResumePreview } from '../../../../../components/resume/ResumePreview';
import { ResumePreviewToolbar } from '../../../../../components/resume/ResumePreviewToolbar';
import { tokens } from '../../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ResumePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams?.id || '';

  const [zoom, setZoom] = useState(1.0);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [template, setTemplate] = useState('classic');

  const { data: resume, isLoading, isError } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getResume(id),
    enabled: !!id,
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
          <Skeleton variant="rounded" height={600} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
        ) : isError || !resume ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Failed to load resume preview.
          </Alert>
        ) : (
          <>
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
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
