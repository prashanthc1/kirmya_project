'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Typography, Skeleton, Button, Stack, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { resumeApi } from '../../../../features/resume/api';
import { ATSScoreCard } from '../../../../components/resume/ATSScoreCard';
import { ResumePreview } from '../../../../components/resume/ResumePreview';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams?.id || '';

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
            onClick={() => router.push('/dashboard/resumes')}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Resumes
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : isError || !resume ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Resume not found or you are not authorized to view this document.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {resume.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Template: {resume.templateName?.toUpperCase()} • Created {new Date(resume.createdAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => router.push(`/dashboard/resumes/${id}/preview`)}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
                >
                  Full Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/dashboard/resumes/${id}/edit`)}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 800, px: 2.5 }}
                >
                  Edit Resume
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mb: 4 }}>
              <ATSScoreCard score={resume.atsScore} />
            </Box>

            <ResumePreview resume={resume} zoom={0.85} />
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
