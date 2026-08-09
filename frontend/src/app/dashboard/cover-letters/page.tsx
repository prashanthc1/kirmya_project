'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { CoverLetterDashboard } from '@/components/cover-letter/CoverLetterDashboard';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { CoverLetter } from '@/features/cover-letter/types';

export default function CoverLettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLetters = async () => {
    try {
      const data = await CoverLetterAPI.list();
      setLetters(data);
    } catch (err) {
      console.error('Failed to load cover letters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const handleEdit = (id: string) => router.push(`/dashboard/cover-letters/${id}/edit`);
  const handlePreview = (id: string) => router.push(`/dashboard/cover-letters/${id}/preview`);
  const handleDuplicate = async (id: string) => {
    await CoverLetterAPI.duplicate(id);
    fetchLetters();
  };
  const handleDownload = (id: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/cover-letters/${id}/download`);
  };
  const handleShare = (id: string) => router.push(`/dashboard/cover-letters/${id}`);
  const handleDelete = async (id: string) => {
    await CoverLetterAPI.delete(id);
    fetchLetters();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="text.primary" mb={1}>
          Cover Letter Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Craft ATS-friendly, job-tailored cover letters powered by Kirmya AI Copilot.
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <CoverLetterDashboard
          letters={letters}
          onCreateNew={() => router.push('/dashboard/cover-letters/create')}
          onGenerateAI={() => router.push('/dashboard/cover-letters/create?mode=ai')}
          onBrowseTemplates={() => router.push('/dashboard/cover-letters/templates')}
          onEdit={handleEdit}
          onPreview={handlePreview}
          onDuplicate={handleDuplicate}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
        />
      )}
    </Container>
  );
}
