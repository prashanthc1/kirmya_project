'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { CoverLetterTemplateSelector } from '@/components/cover-letter/CoverLetterTemplateSelector';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { CoverLetterTemplate } from '@/features/cover-letter/types';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('modern');

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await CoverLetterAPI.getTemplates();
        setTemplates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleSelect = async (templateId: string) => {
    setSelectedId(templateId);
    const created = await CoverLetterAPI.create('New Cover Letter', templateId);
    router.push(`/dashboard/cover-letters/${created.id}/edit`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} color="text.primary" mb={1}>
          Cover Letter Template Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose an ATS-tested layout designed for high readability and recruiter engagement.
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <CoverLetterTemplateSelector
          templates={templates}
          selectedTemplateId={selectedId}
          onSelect={handleSelect}
        />
      )}
    </Container>
  );
}
