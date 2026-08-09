'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Typography, CircularProgress, Button, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { useRouter, useParams } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';
import { ATSScoreCard } from '@/components/resume/ATSScoreCard';
import { ResumePreview } from '@/components/resume/ResumePreview';

export const dynamic = 'force-dynamic';

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {resume.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Template: {resume.templateName.toUpperCase()} • Created {new Date(resume.createdAt).toLocaleDateString()}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => router.push(`/dashboard/resumes/${id}/preview`)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Full Preview
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Download PDF
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push(`/dashboard/resumes/${id}/edit`)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3 }}>
            Edit Resume
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mb: 4 }}>
        <ATSScoreCard score={resume.atsScore} />
      </Box>

      <ResumePreview resume={resume} zoom={0.85} />
    </Container>
  );
}
