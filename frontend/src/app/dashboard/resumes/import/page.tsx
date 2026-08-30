'use client';

import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { ResumeImport } from '../../../../components/resume/ResumeImport';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ResumeImportPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Import Existing Resume Document
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload your existing CV/resume to convert it into an interactive Kirmya ATS resume.
          </Typography>
        </Box>

        <ResumeImport
          onImportSuccess={() => {
            router.push('/dashboard/resumes');
          }}
        />
      </Container>
    </AuthenticatedLayout>
  );
}
