'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Typography, Button, Paper, CircularProgress, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useParams } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';

export const dynamic = 'force-dynamic';

export default function ResumeDownloadPage() {
  const params = useParams();
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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 5, borderRadius: 4, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: '#00CC66', mb: 2 }} />

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Your PDF Resume is Ready
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          {resume.title} • ATS Score {resume.atsScore}% • Vector-embedded selectable PDF format
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={() => window.open(resumeApi.downloadResumeUrl(id), '_blank')}
            sx={{ borderRadius: 2, fontWeight: 800, px: 5, py: 1.5 }}
          >
            Download PDF
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderRadius: 2, fontWeight: 700, px: 4, py: 1.5 }}
          >
            Print
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
