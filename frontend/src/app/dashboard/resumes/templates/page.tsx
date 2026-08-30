'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, Typography, Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { resumeApi } from '../../../../features/resume/api';
import { TemplateSelector } from '../../../../components/resume/TemplateSelector';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ResumeTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['resume-templates'],
    queryFn: () => resumeApi.getTemplates(),
  });

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            ATS-Optimized Resume Templates Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a professionally designed template guaranteed to pass enterprise ATS scanners.
          </Typography>
        </Box>

        {isLoading ? (
          <Skeleton variant="rounded" height={400} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
        ) : (
          <TemplateSelector
            templates={templates}
            selectedTemplateId={selectedTemplate}
            onSelectTemplate={(tplId) => {
              setSelectedTemplate(tplId);
              router.push('/dashboard/resumes/create');
            }}
          />
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
