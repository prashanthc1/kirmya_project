'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { CoverLetterGenerator } from '@/components/cover-letter/CoverLetterGenerator';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { GenerateCoverLetterRequest } from '@/features/cover-letter/types';

export default function CreateCoverLetterPage() {
  const router = useRouter();

  const handleGenerate = async (req: GenerateCoverLetterRequest) => {
    const created = await CoverLetterAPI.generate(req);
    router.push(`/dashboard/cover-letters/${created.id}/edit`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="text.primary" mb={1}>
          Create Cover Letter
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure role requirements and generate a customized cover letter.
        </Typography>
      </Box>

      <CoverLetterGenerator onGenerate={handleGenerate} />
    </Container>
  );
}
