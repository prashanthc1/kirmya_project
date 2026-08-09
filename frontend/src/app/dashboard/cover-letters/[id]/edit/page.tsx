'use client';

import React, { useEffect, useState } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { CoverLetterEditor } from '@/components/cover-letter/CoverLetterEditor';
import { JobPersonalizationDialog } from '@/components/cover-letter/JobPersonalizationDialog';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { CoverLetter } from '@/features/cover-letter/types';

export default function EditCoverLetterPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [tailorDialogOpen, setTailorDialogOpen] = useState(false);

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

  const handleSave = async (updated: CoverLetter) => {
    const saved = await CoverLetterAPI.update(id, updated);
    setLetter(saved);
  };

  if (loading || !letter) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <CoverLetterEditor
        initialLetter={letter}
        onSave={handleSave}
        onOpenTailorDialog={() => setTailorDialogOpen(true)}
      />

      <JobPersonalizationDialog
        open={tailorDialogOpen}
        onClose={() => setTailorDialogOpen(false)}
        onTailor={(desc) => CoverLetterAPI.tailor(id, desc)}
      />
    </Container>
  );
}
