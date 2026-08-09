'use client';

import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { ResumeImport } from '@/components/resume/ResumeImport';

export const dynamic = 'force-dynamic';

export default function ResumeImportPage() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textCenter: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Import Existing Resume Document
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Upload your existing CV/resume to convert it into an interactive Kirmya ATS resume.
        </Typography>
      </Box>

      <ResumeImport
        onImportSuccess={() => {
          router.push('/dashboard/resumes');
        }}
      />
    </Container>
  );
}
