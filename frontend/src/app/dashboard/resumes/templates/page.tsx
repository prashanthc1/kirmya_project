'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';

import { resumeApi } from '@/features/resume/api';
import { TemplateSelector } from '@/components/resume/TemplateSelector';

export const dynamic = 'force-dynamic';

export default function ResumeTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['resume-templates'],
    queryFn: () => resumeApi.getTemplates(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          ATS-Optimized Resume Templates Library
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Select a professionally designed template guaranteed to pass enterprise ATS scanners.
        </Typography>
      </Box>

      <TemplateSelector
        templates={templates}
        selectedTemplateId={selectedTemplate}
        onSelectTemplate={(tplId) => {
          setSelectedTemplate(tplId);
          router.push('/dashboard/resumes/create');
        }}
      />
    </Container>
  );
}
