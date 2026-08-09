'use client';

import React, { useEffect, useState } from 'react';
import { Container, Box, CircularProgress, Button, Stack } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { Download as DownloadIcon, Edit as EditIcon } from '@mui/icons-material';
import { CoverLetterPreview } from '@/components/cover-letter/CoverLetterPreview';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { CoverLetter } from '@/features/cover-letter/types';

export default function PreviewCoverLetterPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLetter() {
      try {
        const data = await CoverLetterAPI.getById(id);
        setLetter(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadLetter();
  }, [id]);

  if (loading || !letter) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Button variant="outlined" onClick={() => router.push(`/dashboard/cover-letters/${id}`)}>
          ← Back to Summary
        </Button>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.push(`/dashboard/cover-letters/${id}/edit`)}>
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/cover-letters/${id}/download`)}
          >
            Download PDF
          </Button>
        </Stack>
      </Box>

      <CoverLetterPreview letter={letter} templateName={letter.templateName} />
    </Container>
  );
}
